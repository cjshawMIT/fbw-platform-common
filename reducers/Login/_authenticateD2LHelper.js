import _ from 'lodash'
import axios from 'axios'
import moment from 'moment'
let Q = require('q')
import D2L from 'valence'

import { getDomain, SCHOOL_TO_BANK } from '../../utilities'
import {isFBWSpring2017} from '../../selectors/bank'

export function instructorCourses (credentials, url) {
  // need to get all of these, because paginated
  let AppContext = new D2L.ApplicationContext(credentials.appID, credentials.appKey);
  let userContext = AppContext.createUserContext(credentials.host, credentials.port, url)
  let enrollmentsUrl = '/d2l/api/lp/1.14/enrollments/myenrollments/'
  // 3 = Course Offering, I think
  // Do we need some sort of startDateTime / endDateTime filter???
  //   http://docs.valence.desire2learn.com/res/enroll.html
  let urlWithFilters = `${enrollmentsUrl}?isActive=true&canAccess=true&orgUnitTypeId=3`
  let options = {
    url: userContext.createAuthenticatedUrl(urlWithFilters, 'GET') + _appendDevRole(credentials)
  }

  // console.log('enrollments options', options)

  let instructorCourseBanks = []
  return axios(options)
  .then((response) => {
    if (process.env.NODE_ENV !== 'test') console.log('got d2l instructor enrollments', response);

    let enrollments = response.data.Items;
    enrollments = _.filter(enrollments, function (enrollment) {
      let subjectName = enrollment.OrgUnit.Name
      return enrollment.OrgUnit.Type.Code == 'Course Offering' &&
        enrollment.Access.IsActive &&
        enrollment.Access.CanAccess &&
        isFBWSpring2017(subjectName);
    });

    if (process.env.NODE_ENV !== 'test') console.log('filtered enrollments', enrollments)

    // instructors can get course terms
    let offeringPromises = []
    _.each(enrollments, (course) => {
      instructorCourseBanks.push({
        id: course.OrgUnit.Id,
        name: course.OrgUnit.Name.trim(),
        orgUnitId: course.OrgUnit.Id
      })
      let url = `/d2l/api/lp/1.5/courses/${course.OrgUnit.Id}`
      let options = {
        url: userContext.createAuthenticatedUrl(url, 'GET') + _appendDevRole(credentials),
        validateStatus: () => {return true}  // evaluate this later, in case of 403s
      }

      offeringPromises.push(axios(options))
    })
    return axios.all(offeringPromises)
  })
  .then((offerings) => {
    // we also need to replace the D2L ID here with the QBank ID
    // And create the QBank banks / aliases?
    if (process.env.NODE_ENV !== 'test') console.log('offerings', offerings);

    let bankTestPromises = []
    _.each(offerings, (offering, index) => {
      if (offering.status !== 403) {
        instructorCourseBanks[index].term = offering.data.Semester.Name.trim()
        instructorCourseBanks[index].department = offering.data.Department.Name.trim()
        instructorCourseBanks[index].displayName = `${instructorCourseBanks[index].name} -- ${offering.data.Semester.Name.trim()}`

        let options = {
          url: `${getDomain()}/middleman/banks/${bankAliasId(instructorCourseBanks[index].id)}`,
          validateStatus: (status) => {return true}  // let's filter the non-existent ones out later
        }
        bankTestPromises.push(axios(options))
      }
    })
    return axios.all(bankTestPromises)
  })
  .then((bankResponses) => {
    // Let's see if the banks exist. For the ones that do not,
    // create them and set alias.
    let createBankPromises = []
    _.each(bankResponses, (response, index) => {
      let offering = instructorCourseBanks[index]
      if (response.status !== 200) {
        // create the bank

        let options = {
          url: `${getDomain()}/middleman/banks`,
          method: 'post',
          data: {
            bankId: SCHOOL_TO_BANK['acc'],
            departmentName: offering.department,
            subjectName: offering.name,
            termName: offering.term,
            aliasId: bankAliasId(offering.id)
          }
        }
        createBankPromises.push(axios(options))
      } else {
        createBankPromises.push(Q.when(response))
      }
    })
    return axios.all(createBankPromises)
  })
  .then((newBanks) => {
    // replace the bankIds
    // console.log('newBanks', newBanks)
    _.each(newBanks, (bank, index) => {
      // console.log('bank', bank)
      instructorCourseBanks[index].id = bank.data.id
    })
    return Q.when(instructorCourseBanks)
  })
  .catch((error) => {
    console.log('error getting d2l enrollments', error)
  })
}

/**
  returns enrolled subjects for students
*/
export function enrollments (credentials, url) {
  // need to get all of these, because paginated
  let AppContext = new D2L.ApplicationContext(credentials.appID, credentials.appKey);
  let userContext = AppContext.createUserContext(credentials.host,
    credentials.port,
    url)
  let enrollmentsUrl = '/d2l/api/lp/1.14/enrollments/myenrollments/'
  let options
  if (process.env.NODE_ENV === 'test') {
    let testBackend = process.env.TEST_BACKEND || 'http://localhost:8888';
    options = {
      url: `${testBackend}/mock-d2l${enrollmentsUrl}?${_appendDevRole(credentials)}`
    }
  } else {
    // 3 = Course Offering, I think
    let urlWithFilters = `${enrollmentsUrl}?isActive=true&canAccess=true&orgUnitTypeId=3`
    options = {
      url: userContext.createAuthenticatedUrl(urlWithFilters, 'GET') + _appendDevRole(credentials)
    }
  }

  return axios(options)
  .then((response) => {
    let enrollments = response.data.Items;
    enrollments = _.filter(enrollments, function (enrollment) {
      let subjectName = enrollment.OrgUnit.Name
      return enrollment.OrgUnit.Type.Code == 'Course Offering' &&
        enrollment.Access.IsActive &&
        enrollment.Access.CanAccess &&
        isFBWSpring2017(subjectName);
    });

    // students cannot view terms
    let d2lCourses = []
    let qbankPromises = []
    _.each(enrollments, function (subject) {
      d2lCourses.push({
        id: subject.OrgUnit.Id,
        name: subject.OrgUnit.Name.trim()
      });
      let url = `${getDomain()}/middleman/banks/${bankAliasId(subject.OrgUnit.Id)}`
      qbankPromises.push(axios({
        url: url,
        validateStatus: (status) => {return true} // let's filter this out later
      }))
    });
    // for students, this looks like (JSON stringified):
    // "[{"id":1583886,"name":"Fly-by-Wire FBW1"}]"
    // console.log('filtered courses', d2lCourses)
    // Now, get the QBank corresponding banks
    return axios.all(qbankPromises)
  })
  .then((responses) => {
    let courseResponses = _.filter(responses, (res) => {return res.status == 200})
    let courseIds, courseResponsesData;

    // console.log('courseResponses')

    if (_.isArray(courseResponses) && courseResponses.length > 0) {
      courseResponsesData = _.map(courseResponses, 'data')
      courseIds = _.map(courseResponsesData, 'id')
    }

    return Q.when(courseResponsesData);
    // return Q.when(courseIds)
  })
  .catch((error) => {
    console.log('error getting d2l enrollments', error)
  })
}

/**
  whoami returns info on logged in user
*/
export function whoami(credentials, url) {
  let AppContext = new D2L.ApplicationContext(credentials.appID, credentials.appKey);
  let userContext = AppContext.createUserContext(credentials.host,
    credentials.port,
    url)
  let whoamiUrl = '/d2l/api/lp/1.5/users/whoami'
  let options

  if (process.env.NODE_ENV === 'test') {
    let testBackend = process.env.TEST_BACKEND || 'http://localhost:8888';
    options = {
      url: `${testBackend}/mock-d2l${whoamiUrl}?${_appendDevRole(credentials)}&sNumber=S99999991`
    }
  } else {
    options = {
      url: userContext.createAuthenticatedUrl(whoamiUrl, 'GET') + _appendDevRole(credentials)
    }
  }

  return axios(options)
  .then((response) => {
    return Q.when(response.data)
  })
  .catch((error) => {
    console.log('error getting whoami', error)
  })
}

function _appendDevRole(credentials) {
  if (process.env.NODE_ENV !== 'production') {
    return '&role=' + credentials.role
  }

  return '';
}

export function bankAliasId (courseId) {
  return `assessment.Bank%3A${courseId}%40ACC.D2L.COM`
}

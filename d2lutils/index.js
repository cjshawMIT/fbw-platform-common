import _ from 'lodash'
import axios from 'axios'
import Q from 'q'
import D2L from 'valence'

import { getDomain } from '../utilities'

export function getAuthenticationUrl (credentials) {
  let AppContext = new D2L.ApplicationContext(credentials.appID, credentials.appKey);
  let authenticationUrl = AppContext.createUrlForAuthentication(credentials.host,
    credentials.port,
    credentials.callbackUrl)

  return authenticationUrl
}

export function whoami (credentials, url) {
  let AppContext = new D2L.ApplicationContext(credentials.appID, credentials.appKey);
  let userContext = AppContext.createUserContext(credentials.host,
    credentials.port,
    url)
  let whoamiUrl = '/d2l/api/lp/1.5/users/whoami'
  let options = {
    url: userContext.createAuthenticatedUrl(whoamiUrl, 'GET')
  }

  return axios(options)
  .then((response) => {
    return Q.when(response.data)
  })
  .catch((error) => {
    console.log('error getting whoami', error)
  })
}

export function enrollments (credentials, url) {
  // need to get all of these, because paginated
  let AppContext = new D2L.ApplicationContext(credentials.appID, credentials.appKey);
  let userContext = AppContext.createUserContext(credentials.host,
    credentials.port,
    url)
  let enrollmentsUrl = '/d2l/api/lp/1.14/enrollments/myenrollments/'
  // 3 = Course Offering, I think
  let urlWithFilters = `${enrollmentsUrl}?isActive=true&canAccess=true&orgUnitTypeId=3`
  let options = {
    url: userContext.createAuthenticatedUrl(urlWithFilters, 'GET')
  }
  // console.log(options)
  return axios(options)
  .then((response) => {
    let enrollments = response.data.Items
    enrollments = _.filter(enrollments, function (enrollment) {
      return enrollment.OrgUnit.Type.Code == 'Course Offering' &&
        enrollment.Access.IsActive &&
        enrollment.Access.CanAccess;
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
    let courseIds
    if (_.isArray(courseResponses) && courseResponses.length > 0) {
      let courseResponsesData = _.map(courseResponses, 'data')
      courseIds = _.map(courseResponsesData, 'id')
    }
    return Q.when(courseIds)
  })
  .catch((error) => {
    console.log('error getting d2l enrollments', error)
  })
  // let bookmark = ''
  // let enrollments = []
  // let hasMoreItems = true

  // not sure how to handle paging with promises, so for now assume that using
  // filters successfully limits results to one page
  // function getNextPage () {
  //   let bookmarkUrl = `${enrollmentsUrl}?isActive=true&canAccess=true`
  //   let nextPageOptions = {
  //     url: userContext.createAuthenticatedUrl(bookmarkUrl, 'GET')
  //   }
  //   return axios(nextPageOptions)
  //   .then((data) => {
  //     console.log(data)
  //     hasMoreItems = typeof data.PagingInfo.HasMoreItems !== 'undefined' ? data.PagingInfo.HasMoreItems : false;
  //     bookmark = typeof data.PagingInfo.Bookmark !== 'undefined' ? data.PagingInfo.Bookmark : '';
  //     enrollments = enrollments.concat(data.Items);
  //     if (!hasMoreItems) {
  //       enrollments = _.filter(enrollments, function (enrollment) {
  //         return enrollment.OrgUnit.Type.Code == 'Course Offering' &&
  //           enrollment.Access.IsActive &&
  //           enrollment.Access.CanAccess;
  //       });
  //
  //       // students cannot view terms
  //       var d2lCourses = [];
  //       _.each(enrollments, function (subject) {
  //         d2lCourses.push({
  //           id: subject.OrgUnit.Id,
  //           name: subject.OrgUnit.Name.trim()
  //         });
  //       });
  //       // for students, this looks like (JSON stringified):
  //       // "[{"id":1583886,"name":"Fly-by-Wire FBW1"}]"
  //       return Q.when(d2lCourses);
  //     } else {
  //       return getNextPage();
  //     }
  //   })
  // }
  //
  // getNextPage();
}

export function stringifyUsername (whoami) {
  return `${whoami.FirstName}-${whoami.LastName}-${whoami.Identifier}`
}

export function extractDisplayName (username) {
  if (username.indexOf('-') >= 0) {
    return `${username.split('-')[0]} ${username.split('-')[1]}`
  } else {
    return username
  }
}

export function bankAliasId (courseId) {
  return `assessment.Bank%3A${courseId}%40ACC.D2L.COM`
}

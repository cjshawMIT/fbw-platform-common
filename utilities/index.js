import _ from 'lodash'
import axios from 'axios'
import Q from 'q'

let config = require('../configuration')
import { isTarget } from '../selectors/mission'

export const isLocal = (conf) => conf === 'dev'

// this is a horrible hack...
export const isBrowser = () => {
  if (window.location) {
    return true;
  }

  return false;
}

export const getDomain = () => {
  // // if it's browser or someone is running a headless test without window var
  // if (isBrowser() || process.env.NODE_ENV === 'test') {
  //   if (process.env.NODE_ENV === 'production') {
  //     let host = window.location.host;
  //
  //     if (host === 'adaptive-instructor.mit.edu' || host === 'adaptive.mit.edu') {
  //       return 'https://adaptive-assessments.herokuapp.com';
  //
  //     // if webapp is running on *-dev, route to -dev middleman
  //     } else {
  //       return 'https://adaptive-assessments-dev.herokuapp.com';
  //     }
  //   }
  //
  //   // call against the local middleman in 'test' and 'dev' environments
  //   return 'http://localhost:8888';
  // }

  // For now, not sure how this will work with native -- assume
  //   using web browser, not native app? Otherwise will have to re-work
  //   how the environment gets injected.
  return process.env.BACKEND || 'http://localhost:8888';
}

export const matches = (needle, haystack) => {
  let parts = needle.split(' ');
  let partQ = '';
  for (let i=0; i<parts.length; i++) {
    if (i==0) {
      partQ = '(?=.*\\b' + parts[i] + ')';
    } else {
      partQ = partQ + '(?=.*\\b' +  parts[i] + ')';
    }
  }

  let re = new RegExp(partQ, 'gi')
  let matching = re.test(haystack);

  return matching;
}

export function getSchoolQBankId (school) {
  return `fbw-school%3A${school}%40FBW.MIT.EDU`
}


export function updateQuestionWithResponse(question, response) {
  return _.assign({}, question, {
    responded: true,
    isCorrect: response.isCorrect,
    response: response
  })
}


export function updateAssessmentSectionsWithResponse (sections, response) {
  let submittedQuestion
  let _assessmentSections = _.map(sections, (section) => {
    let submittedQuestion = _.find(section.questions, {id: response.questionId});

    // find the section in which the submitted question belongs -- need to update it
    if (submittedQuestion) {
      let routeFinished = false;
      let updatedSection = _.assign({}, section, {
        questions: _.map(section.questions, (question, idx) => {
          // first we find and update the question that was just submitted (that generated this response)
          if (question.id === response.questionId) {
            return updateQuestionWithResponse(question, response);
          }

          return question;
        })
      });

      // we already have Target questions in our list, so we ignore them and only add Waypoints
      if (response.nextQuestion && !isTarget(response.nextQuestion)) {
        updatedSection.questions.push(response.nextQuestion);
      } else if (isTarget(response.nextQuestion) && !response.showAnswer) {
        // this one route is finished
        routeFinished = true;
      } else if (!response.nextQuestion) {
        // means you hit the end of the route / last target
        routeFinished = true;
      }

      console.log('response.nextQuestion?', response.nextQuestion)

      return updatedSection;
    }

    return section;
  });

  return _assessmentSections
}


export function findBankDomain (bankId, enrolledBanks) {
  // handles both simple login (hardcoded bankIds) and D2L-linked banks
  if (_.keys(BANK_TO_DOMAIN).indexOf(bankId) >= 0) {
    return BANK_TO_DOMAIN[bankId]
  } else {
    console.log('bankId', bankId, 'enrolledBanks', enrolledBanks)
    let department = _.find(enrolledBanks, {id: bankId}).department.toLowerCase()
    console.log('department', department)
    switch (department) {
      case 'accounting':
      case 'acc':
        return 'accounting'

      case 'algebra':
      case 'alg':
      case 'mat':
      case 'math':
      case 'collegealgebra':
      case 'college_algebra':
        return 'algebra'

      case 'sandbox':
        return 'algebra'

      default:
        return 'accounting'
    }
  }
}

export function findBankLibrary (bankId, enrolledBanks) {
  let department = findBankDomain(bankId, enrolledBanks)
  return DOMAIN_TO_LIBRARY[department]
}


export const SCHOOL_TO_BANK = {"acc": "assessment.Bank%3A57279fc2e7dde08807231e61%40bazzim.MIT.EDU",
                               "qcc": "assessment.Bank%3A57279fcee7dde08832f93420%40bazzim.MIT.EDU"}

export const BANK_TO_DOMAIN = {"assessment.Bank%3A57d70ed471e482a74879349a%40bazzim.MIT.EDU": "accounting",
                               "assessment.Bank%3A576d6d3271e4828c441d721a%40bazzim.MIT.EDU": "algebra"}

export const DOMAIN_TO_LIBRARY = {"accounting": "assessment.Bank%3A57279fbce7dde086c7fe20ff%40bazzim.MIT.EDU",
                                  "algebra": "assessment.Bank%3A57279fb9e7dde086d01b93ef%40bazzim.MIT.EDU"}

export const BANK_TO_LIBRARY = {"assessment.Bank%3A57d70ed471e482a74879349a%40bazzim.MIT.EDU": "assessment.Bank%3A57279fbce7dde086c7fe20ff%40bazzim.MIT.EDU",
                                "assessment.Bank%3A576d6d3271e4828c441d721a%40bazzim.MIT.EDU": "assessment.Bank%3A57279fb9e7dde086d01b93ef%40bazzim.MIT.EDU"}

export const LO_SCAFFOLD_MISSION_GENUS_TYPE = "assessment-part-genus-type%3Afbw-specify-lo%40ODL.MIT.EDU"
export const TEST_FLIGHT_MISSION = "assessment-genus%3Afbw-in-class-mission%40ODL.MIT.EDU"
export const PRE_FLIGHT_MISSION = "assessment-genus%3Afbw-homework-mission%40ODL.MIT.EDU"
export const PHASE_I_MISSION_RECORD_TYPE = "assessment-record-type%3Afbw-phase-i%40ODL.MIT.EDU"
export const PHASE_II_MISSION_RECORD_TYPE = "assessment-record-type%3Afbw-phase-ii%40ODL.MIT.EDU"

export const BASE_BANKS = ['assessment.Bank%3AROOT%40ODL.MIT.EDU',
  'assessment.Bank%3A000000000000000000000000%40ODL.MIT.EDU',
  'assessment.Bank%3A000000000000000000000000%40bazzim.MIT.EDU']
export const STUDENT_AUTHORIZATION_FUNCTIONS = ['assessment.AssessmentTaken%3Acreate%40ODL.MIT.EDU',
  'assessment.AssessmentTaken%3Alookup%40ODL.MIT.EDU',
  'assessment.Assessment%3Atake%40ODL.MIT.EDU',
  'assessment.Bank%3Alookup%40ODL.MIT.EDU',
  'commenting.Book%3Alookup%40ODL.MIT.EDU',
  'commenting.Comment%3Alookup%40ODL.MIT.EDU',
  'hierarchy.Hierarchy%3Alookup%40ODL.MIT.EDU',
  'logging.Log%3Alookup%40ODL.MIT.EDU',
  'repository.Asset%3Acreate%40ODL.MIT.EDU',
  'repository.Asset%3Adelete%40ODL.MIT.EDU',
  'repository.Asset%3Alookup%40ODL.MIT.EDU',
  'repository.Asset%3Asearch%40ODL.MIT.EDU',
  'repository.Repository%3Alookup%40ODL.MIT.EDU',
  'resource.Bin%3Alookup%40ODL.MIT.EDU',
  'resource.Resource%3Alookup%40ODL.MIT.EDU']


import _ from 'lodash'

import { BANK_TO_DOMAIN, DOMAIN_TO_LIBRARY, BANK_TO_LIBRARY } from '../utilities'

let moment = require('moment');
require('moment-timezone');

export const isTarget = (question) => {
  if (question && question.displayName) {
    return question.displayName.text.indexOf('.') < 0;
  }

  return undefined;
}

export const targetKey = (target) => {
  return target ? target.displayName.text[0] : null;
}

export const targetStatus = (target) => {
  var status = 'PRISTINE';

  if (target.hasNavigated && !target.isCorrect) {
    status = 'NAVIGATED';

  } else if (target.responded && target.isCorrect) {
    status = 'COMPLETE';
  } else if (target.responded && !target.isCorrect) {
    status = 'FAIL';
  }

  return status;
}

export const filterItemsByTarget = (items) => {
  return _.reduce(items, (result, item) => {
    let itemKey = targetKey(item);

    if (!itemKey) return null;

    if (!result[itemKey]) result[itemKey] = [];
    result[itemKey].push(item);

    return result;
  }, {});
}

export const directiveIdsFromQuestions = (questionsData) => {
  return _.map(questionsData, (section, index) => section.learningObjectiveId);
}

export const validSNumber = (sNumber) => {
  // check if S# is 8 or 9 digits following an S
  try {
    let numericValue = sNumber.substring(1, sNumber.length - 1);
    return !isNaN(numericValue) && (sNumber[0] == 'S' || sNumber[0] == 'I') && (sNumber.length == 9 || sNumber.length == 10);
  } catch (e) {
    return false;
  }

}

export const localDateTime = (utcDateObject) => {
  // convert our UTC date / time (already converted to JS format from python
  // format by our reducer) to local timezone
  let timezone = moment.tz.guess()

  return moment.utc(utcDateObject).clone().tz(timezone)
}

export function checkMissionStatus (mission) {
  let st = mission.startTime
  let dl = mission.deadline
    // need to subtract one because when you construct a Date object here,
    // it assumes 0 index....but the native input and server-side use 1 index
  let startTime = moment.utc(st)
  let deadline = moment.utc(dl)
  let now = moment.utc()

  if (deadline < now) {
    return 'over'
  } else if (startTime <= now && now <= deadline) {
    return 'pending'
  } else {
    return 'future'
  }
};

export function hasAchievedDirective (targets) {
  if (!targets) return false;

  let min = Math.ceil(targets.length / 2);
  let numCorrect = _.reduce(targets, (result, question) => {
    if (question.isCorrect) result+=1;
    return result;
  }, 0)

  return numCorrect >= min;
}

export function getTargetQuestions (state) {
  let questions
  if (state.mission.currentTarget && state.mission.currentMissionSections) {
    let directiveQuestions = state.mission.currentMissionSections[state.mission.currentDirectiveIndex].questions
    let routeQuestions = filterItemsByTarget(directiveQuestions)
    questions = routeQuestions[targetKey(state.mission.currentTarget)]
  }
  return questions
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

      default:
        return 'accounting'
    }
  }
}

export function findBankLibrary (bankId, enrolledBanks) {
  let department = findBankDomain(bankId, enrolledBanks)
  return DOMAIN_TO_LIBRARY[department]
}

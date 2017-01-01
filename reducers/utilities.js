import _ from 'lodash'
let moment = require('moment')

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

export function qbankToMoment(timeObject) {
  return moment.utc({
    years: timeObject.year,
    months: timeObject.month - 1,
    days: timeObject.day,
    hours: timeObject.hour,
    minutes: timeObject.minute,
    second: timeObject.second
  })
}

export function convertPythonDateToJS (pythonTime) {
  return {
    year: pythonTime.year,
    month: pythonTime.month - 1,
    day: pythonTime.day,
    hour: pythonTime.hour,
    minute: pythonTime.minute,
    second: pythonTime.second
  }
}

export const isLocal = () => location.host.indexOf('localhost') > -1

export const getDomain = () => isLocal() ? 'http://localhost:8888' : 'https://fbw-web-backend.herokuapp.com'

export function momentToQBank(momentObject) {
  let timeUTC = momentObject.utc().toObject();

  return {
    year: timeUTC.years,
    month: timeUTC.months + 1,
    day: timeUTC.date,
    hour: timeUTC.hours,
    minute: timeUTC.minutes,
    second: timeUTC.seconds
  }
}

export function afterMidnight(timeObject) {
  return {
    year: timeObject.year,
    month: timeObject.month,
    day: timeObject.day,
    hour: 0,
    minute: 0,
    second: 1
  }
}

export function beforeMidnight(timeObject) {
    return {
    year: timeObject.year,
    month: timeObject.month,
    day: timeObject.day,
    hour: 23,
    minute: 59,
    second: 59
  }
}

export function adjustedQBankToMoment(timeObject) {
  // for mission times that were already adjusted in stores,
  // and moment.js takes months as 1-12
  return moment.utc({
    years: timeObject.year,
    months: timeObject.month + 1,
    days: timeObject.day,
    hours: timeObject.hour,
    minutes: timeObject.minute,
    second: timeObject.second
  })
}

// export function convertPythonDateToJS(pythonTime) {
//   return {
//     year: pythonTime.year,
//     month: pythonTime.month - 1,
//     day: pythonTime.day,
//     hour: pythonTime.hour,
//     minute: pythonTime.minute,
//     second: pythonTime.second
//   }
// }

export function getSchoolQBankId (school) {
  return `fbw-school%3A${school}%40FBW.MIT.EDU`
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

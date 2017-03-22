// mission reducer
import _ from 'lodash'

import {targetKey, targetStatus, filterItemsByTarget } from '../../selectors/mission'
import { updateAssessmentSectionsWithResponse, updateQuestionWithResponse } from '../../utilities'

import {SELECT_MISSION} from './selectMission'
import { GET_MISSIONS_OPTIMISTIC, RECEIVE_MISSIONS } from './getMissions'
import { GET_SECTION_QUESTIONS_OPTIMISTIC, RECEIVE_SECTION_QUESTIONS } from './getSectionQuestions'
import { CREATE_TAKE_MISSION_OPTIMISTIC, CREATE_TAKE_MISSION, RECEIVE_CREATE_TAKE_MISSION } from './selectOpenMission'
import { GET_USER_MISSION_RESULTS_OPTIMISTIC, RECEIVE_GET_USER_MISSION_RESULTS } from './selectClosedMission'
import { SUBMIT_RESPONSE, SUBMIT_RESPONSE_OPTIMISTIC, RECEIVE_SUBMIT_RESPONSE } from './submitResponse'
import { SHOW_ANSWER_OPTIMISTIC, RECEIVE_SHOW_ANSWER } from './showAnswer'
import {RECEIVE_UPDATE_MISSION} from '../edit-mission/updateMission'

import {SELECT_MISSION_RESULT} from './selectMissionResult'
import { SELECT_DIRECTIVE } from './selectDirective'
import { SELECT_TARGET } from './selectTarget'
import { SELECT_CHOICE } from './selectChoice'
import { SET_QUESTION_LIST_HEIGHT } from './setQuestionListHeight'
import { SET_CHOICE_HEIGHT } from './setChoiceHeight'

import {RECEIVE_SELECT_BANK} from '../Bank/selectBank'

import {RECEIVE_CREATE_MISSION} from '../edit-mission/createMission'
import {RECEIVE_DELETE_MISSION} from '../edit-mission/deleteMission'
import {LOG_OUT} from '../Login/logOutUser'

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {}
export default function missionReducer (state = initialState, action) {
  switch (action.type) {
    case GET_MISSIONS_OPTIMISTIC:
      return _.assign({}, state, {
        missions: [],
        isGetMissionsInProgress: true
      })

    case RECEIVE_MISSIONS:
      return _.assign({}, state, {
        missions: action.missions,
        isGetMissionsInProgress: false,
        currentMission: null
      })

    case RECEIVE_SELECT_BANK:
      return _.assign({}, state, {
        missions: null
      })

    case SELECT_MISSION:
      return _.assign({}, state, {
        currentMission: action.mission,
        currentDirectiveIndex: 0
      })

    // ==== from edit-mission ====
    case RECEIVE_CREATE_MISSION:
      return _.assign({}, state, {
        currentMission: action.mission,
        missions: _.compact(_.concat(action.mission, state.missions)),      // creates a new array of existing missions with the new mission appended
      })

    case RECEIVE_DELETE_MISSION:
      return _.assign({}, state, {
        currentMission: null,
        missions: _.filter(state.missions, (m) => {
          return m.id !== action.mission.id
        })
      })
    // =========

    case SELECT_DIRECTIVE:
      return _.assign({}, state, {
        currentDirectiveIndex: action.directiveIndex,
        currentTarget: null,
        selectedChoiceId: null
      })

    case SELECT_TARGET:
      return _.assign({}, state, {
        currentTarget: action.target,
        questionListHeight: 0,
        heightByChoice: {},
        selectedChoiceId: null
      })

    case CREATE_TAKE_MISSION_OPTIMISTIC:
    case GET_USER_MISSION_RESULTS_OPTIMISTIC:
      return _.assign({}, state, {
        currentMissionSections: null,
        resultsExistForUser: true,
        currentMission: action.mission,
        isSubmitTakeMissionInProgress: true
      });

    case RECEIVE_CREATE_TAKE_MISSION:
      return _.assign({}, state, {
        resultsExistForUser: true,
        currentMissionSections: action.mission,
        currentDirectiveIndex: null,
        isSubmitTakeMissionInProgress: false
      });

    case GET_SECTION_QUESTIONS_OPTIMISTIC:
      return state

    case RECEIVE_SECTION_QUESTIONS:
      let updatedSections = _.assign([], state.currentMissionSections)
      updatedSections[state.currentDirectiveIndex].questions = action.questions

      _.each(updatedSections, (section) => {
        let sortedItems = filterItemsByTarget(section.questions);
        let targetsNavigatedInSection = [];
        _.each(sortedItems, (questionsList, targetKey) => {
          // Now go through each of the non-pristine target questions and figure out
          //   if the route has been finished.
          // If the route ends in an unanswered question, route not finished.
          // If the route ends in a wrong response, route not finished.
          // Route only finished if the last question isCorrect.
          if (targetStatus(questionsList[0], section.questions) !== 'PRISTINE') {
            let lastRouteQuestion = questionsList[questionsList.length - 1];
            if (lastRouteQuestion.responded && lastRouteQuestion.isCorrect) {
              targetsNavigatedInSection.push(questionsList[0].id);
            }
          }
        });
        _.each(section.questions, (question) => {
          if (targetsNavigatedInSection.indexOf(question.id) >= 0) {
            question.hasNavigated = true;
          }
        })
      });

      return _.assign({}, state, {
        currentMissionSections: updatedSections
      })

    case RECEIVE_GET_USER_MISSION_RESULTS:
      return _.assign({}, state, {
        resultsExistForUser: action.resultsExistForUser,
        currentMissionSections: action.mission,
        isSubmitTakeMissionInProgress: false
      });

    case SELECT_MISSION_RESULT:
      let questions = _.flatMap(action.missionResult.sections, 'questions');
      let currentTarget = _.find(questions, q => q.itemId === action.question.itemId)

      if (currentTarget) {
        // otherwise get into a circular reference and cannot
        //   JSON stringify, when add in total / achieved / notAchieved
        currentTarget = _.assign({}, currentTarget);
      }

      if (action.question.notAchieved) {
        // for the case with student results in instructor dashboard
        currentTarget.notAchieved = action.question.notAchieved
        currentTarget.total = action.question.total
        currentTarget.achieved = action.question.achieved
      }

      return _.assign({}, state, {
        currentMissionSections: action.missionResult.sections,
        currentDirectiveIndex: action.currentDirectiveIndex,
        currentTarget: currentTarget
      });

    case SUBMIT_RESPONSE_OPTIMISTIC:
      return _.assign({}, state, {
        isInProgressSubmitChoice: true,
        selectedChoiceId: null
      })

    case SHOW_ANSWER_OPTIMISTIC:
      return _.assign({}, state, {
        isInProgressShowAnswer: true,
        selectedChoiceId: null
      })

    case RECEIVE_SUBMIT_RESPONSE:
      // update state missions (insert the new question if it's not a target),
      // and also the responded question's response state
      return _.assign({}, state, {
        isInProgressSubmitChoice: false,
        currentTarget: updateQuestionWithResponse(state.currentTarget, action.response),
        currentMissionSections: updateAssessmentSectionsWithResponse(state.currentMissionSections,
          action.response)
      })

    case RECEIVE_SHOW_ANSWER:
      // update state missions (insert the new question if it's not a target),
      // and also the responded question's response state
      return _.assign({}, state, {
        isInProgressShowAnswer: false,
        currentTarget: updateQuestionWithResponse(state.currentTarget, action.response),
        currentMissionSections: updateAssessmentSectionsWithResponse(state.currentMissionSections,
          action.response)
      })

    case SET_QUESTION_LIST_HEIGHT:
      return _.assign({}, state, {
        questionListHeight: action.questionListHeight
      })

    case SELECT_CHOICE:
      return _.assign({}, state, {
        selectedChoiceId: action.choiceId
      })

    case SET_CHOICE_HEIGHT:
      let updatedHeightMap = _.assign({}, state.heightByChoice, action.height)
      return _.assign({}, state, {
        heightByChoice: updatedHeightMap
      })

    case LOG_OUT:
      return _.assign({}, state, {
        currentMission: null,
        missions: null,
        isGetMissionsInProgress: false
      })

    case RECEIVE_UPDATE_MISSION:
      return _.assign({}, state, {
        missions: _.map(state.missions, (m) => {
          if (m.id === action.mission.id) {
            return action.mission;
          }

          return m;
        }),
        currentMission: action.mission
      })

    default:
      return state
  }
}

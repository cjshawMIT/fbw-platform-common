
import _ from 'lodash'
import axios from 'axios'

import { getDomain } from '../../utilities'
import {convertImagePaths} from './_convertImagePaths'

// ----
// Action types
export const SUBMIT_RESPONSE = 'SUBMIT_RESPONSE'
export const SUBMIT_RESPONSE_OPTIMISTIC = 'SUBMIT_RESPONSE_OPTIMISTIC'
export const RECEIVE_SUBMIT_RESPONSE = 'RECEIVE_SUBMIT_RESPONSE'

// ----

// ------------------------------------
// Actions
// ------------------------------------

export function receiveSubmitResponse(response) {
  return {type: RECEIVE_SUBMIT_RESPONSE, response};
}

export function submitResponseOptimistic(data) {
  return {type: SUBMIT_RESPONSE_OPTIMISTIC, data };
}

export function submitResponse(data) {

  return function(dispatch) {
    _validate(data);
    dispatch(submitResponseOptimistic());

    let options = {
      url: `${getDomain()}/middleman/banks/${data.bankId}/takens/${data.section.id}/questions/${data.questionId}/submit`,
      method: 'POST',
      data: {
        choiceIds: [data.choiceId],
        type: 'answer-record-type%3Amulti-choice-with-files-and-feedback%40ODL.MIT.EDU'
      },
      headers: {
        'x-fbw-username': data.username
      }
    }

    return axios(options)
    .then((results) => {
      // update the response here with questionId, so we can
      // find it when updating the state
      let response = results.data
      response.questionId = data.questionId
      response.choiceIds = [data.choiceId]

      dispatch(receiveSubmitResponse(response));

      return response;
    })
    .catch((error) => {
      console.log('error submitting response', error);
    });
  }
}

function _validate(data) {
  if (!data.bankId) {
    throw new TypeError('bankId must be non-null')
  }

  if (!data.section || !data.section.id) {
    throw new TypeError('section must be an object with key "id"')
  }

  if (!data.questionId) {
    throw new TypeError('questionId must be non-null')
  }

  if (!data.choiceId) {
    throw new TypeError('choiceId must be non-null')
  }

  if (!data.username) {
    throw new TypeError('username must be non-null')
  }
}

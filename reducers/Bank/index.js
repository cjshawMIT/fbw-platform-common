// bank reducer

import thunk from 'redux-thunk';
import _ from 'lodash'

import {RECEIVE_BANKS} from './getBanks'
import {RECEIVE_SELECT_BANK, SELECT_BANK_OPTIMISTIC} from './selectBank'
import {RECEIVE_ITEMS} from './getItems'

// ------------------------------------
// Reducer
// ------------------------------------
const VISITOR_BANKS = [{id:'assessment.Bank%3A57d70ed471e482a74879349a%40bazzim.MIT.EDU'},
  {id:'assessment.Bank%3A576d6d3271e4828c441d721a%40bazzim.MIT.EDU'}]

const initialState = {
  enrolledBanks: VISITOR_BANKS
}
export default function bankReducer (state = initialState, action) {
  switch (action.type) {
    case RECEIVE_BANKS:
      return _.assign({}, state, {
        banks: action.banks
      });

    case SELECT_BANK_OPTIMISTIC:
      return _.assign({}, state, {
        currentBank: action.bank,
        getPrivateBankIdInProgress: true,
        privateBankId: null
      });

    case RECEIVE_SELECT_BANK:
      return _.assign({}, state, {
        privateBankId: action.privateBankId,
        getPrivateBankIdInProgress: false
      })

    case RECEIVE_ITEMS:
      return _.assign({}, state, {
        items: action.items
      });

    default:
      return state
  }
}

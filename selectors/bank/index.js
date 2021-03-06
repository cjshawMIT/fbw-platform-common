import _ from 'lodash'

import { BANK_TO_DOMAIN, DOMAIN_TO_LIBRARY, BANK_TO_LIBRARY } from '../../utilities'

export function getRoster(state) {
  return state.bank.roster;
}

export function getEnrolledSubject(state) {
  // return state.bank.banks && state.bank.banks.length > 0 ? state.bank.banks[0] : null;
  if (state.login.isLoggedIn && !state.login.isVisitor) {
    // for instructor, they pick a bank, so we need to give that option, too
    if (state.bank.currentBank) {
      return state.bank.currentBank
    }

    // D2L login, (assuming no QCC yet), so pull enrolled subject from banks
    // via section name
    return _.find(state.bank.banks, (bank) => {
      let sectionName = bank.displayName.text ? bank.displayName.text : bank.displayName
      if (isFBWSpring2017(sectionName)) {
        return true
      }
      return false
    })
  } else {
    // visitor login where they have to pick a bank manually
    return state.bank.currentBank ? state.bank.currentBank : null;
  }
}


export function findBankDomain (bankId, enrolledBanks) {
  // handles both simple login (hardcoded bankIds) and D2L-linked banks
  if (_.keys(BANK_TO_DOMAIN).indexOf(bankId) >= 0) {
    return BANK_TO_DOMAIN[bankId]
  } else {
    // console.log('bankId', bankId, 'enrolledBanks', enrolledBanks)
    let department = _.find(enrolledBanks, {id: bankId}).department.toLowerCase()
    // console.log('department', department)
    switch (department) {
      case 'accounting':
      case 'acc':
        return 'accounting'

      case 'algebra':
      case 'alg':
      case 'mat':
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

export function isFBWSpring2017(name) {
  name = name.toLowerCase()
  return isFBW(name) ||
    (name.indexOf('sp17') >= 0 &&
    (isMAT121(name) || isACC(name)))
}

function isFBW(name) {
  return name.indexOf('fly-by-wire') >= 0 || name.indexOf('fbw') >= 0
}

function isMAT121(name) {
  return name.indexOf('mat') >= 0 &&
    name.indexOf('121') >= 0 &&
    (name.indexOf('142') >= 0 || name.indexOf('103') >= 0)
}

function isACC(name) {
  return name.indexOf('acc') >= 0 &&
    name.indexOf('202') >= 0
}

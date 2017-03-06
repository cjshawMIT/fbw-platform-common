import _ from 'lodash'
import moment from 'moment'
require('moment-timezone')
import reducer from '../index'
import {ADD_MISSION} from '../addMission'
import {EDIT_MISSION} from '../editMission'
import {RECEIVE_CREATE_MISSION} from '../createMission'

import {UPDATE_SPAWN_DATE} from '../updateSpawnDate'

import {beforeMidnight, afterMidnight} from '../../../utilities/time'

import {createMission} from '../createMission'
import {deleteMission} from '../deleteMission'
import {updateMission} from '../updateMission'

import thunk from 'redux-thunk'
import configureMockStore from 'redux-mock-store'
const middlewares = [ thunk ]
const mockStore = configureMockStore(middlewares)

let chai = require('chai');
const chaiHttp = require('chai-http');

let should = require('should');
chai.should();
chai.use(chaiHttp);
const BASE_URL = process.env.TEST_BACKEND || 'example.com' // for verifying some stuff...

const directives = [
  {
    id: 'mc3-objective%3A15206%40MIT-OEIT'    // add/subtract/multiply 2 functions
  },
  {
    id: 'mc3-objective%3A15143%40MIT-OEIT'    // decompose a function
  },
  {
    id: 'mc3-objective%3A14229%40MIT-OEIT'    // find center and radius of circle
  },
  {
    id: 'mc3-objective%3A15027%40MIT-OEIT',   // find midpoint of segement
  },
  {
    id: 'mc3-objective%3A15119%40MIT-OEIT'  // find the zero of linear funciton
  },
  {
    id: 'mc3-objective%3A15115%40MIT-OEIT'    // solve linear equ
  },
  {
    id: 'mc3-objective%3A15058%40MIT-OEIT'    // find eqn of line given two points
  }
];

const DIRECTIVE_TO_REMOVE = 'mc3-objective%3A15058%40MIT-OEIT'   // find eqn of line given two points
const NEW_DIRECTIVE_ID = 'mc3-objective%3A14239%40MIT-OEIT'      // find the equation of line from its graph

const directivesItemsMap = {
  'mc3-objective%3A15059%40MIT-OEIT': 6,
  'mc3-objective%3A15062%40MIT-OEIT': 6,
  'mc3-objective%3A15206%40MIT-OEIT': 6,
  'mc3-objective%3A15143%40MIT-OEIT': 3,
  'mc3-objective%3A14229%40MIT-OEIT': 6,
  'mc3-objective%3A15027%40MIT-OEIT': 6,
  'mc3-objective%3A15119%40MIT-OEIT': 6,
  'mc3-objective%3A15115%40MIT-OEIT': 6,
  'mc3-objective%3A15058%40MIT-OEIT': 6,
  'mc3-objective%3A14239%40MIT-OEIT': 6
}

const MAT_BANK_ID = 'assessment.Bank%3A58498ccb71e482e47e0ed8ce%40bazzim.MIT.EDU';
const TEST_MISSION = {
    displayName: {
        text: "Test editing mission"
    },
    startTime: moment(),
    deadline: moment().add(30, 'days'),
    selectedDirectives: directives
}

let newMission

const isUTC = moment.utc() == moment()


describe('edit-mission reducer', () => {

  it('should update the state upon the ADD_MISSION action', () => {
    let newState = reducer({}, {
      type: ADD_MISSION,
    });

    newState.newMission.selectedDirectives.should.eql([]);
  });

  it('should update the state upon the EDIT_MISSION action', () => {
    let newState = reducer({}, {
      type: EDIT_MISSION,
      mission: {
        name: 'foo'
      }
    });

    newState.newMission.name.should.eql('foo');
  });

  it('should set startTime and deadline to moment objects in the EDIT_MISSION action', () => {
    let localStartTime = moment({
      year: 2017,
      month: 1,
      day: 1,
      hour: 0,
      minute: 0,
      second: 1
    })
    let utcStartTime = localStartTime.utc()
    let localDeadline = moment({
      year: 2017,
      month: 1,
      day: 5,
      hour: 23,
      minute: 59,
      second: 59
    })
    let utcDeadline = localDeadline.utc()

    let startTime = {
      year: utcStartTime.year(),
      month: utcStartTime.month(),
      day: utcStartTime.date(),
      hour: utcStartTime.hour(),
      minute: utcStartTime.minute(),
      second: utcStartTime.second()
    };
    let deadline = {
      year: utcDeadline.year(),
      month: utcDeadline.month(),
      day: utcDeadline.date(),
      hour: utcDeadline.hour(),
      minute: utcDeadline.minute(),
      second: utcDeadline.second()
    }

    let newState = reducer({}, {
      type: EDIT_MISSION,
      mission: {
        startTime: startTime,
        deadline: deadline
      }
    });
    newState.newMission.startTime.hour().should.eql(utcStartTime.hour())
    newState.newMission.deadline.hour().should.eql(utcDeadline.hour())
  });

  it('should update the state upon the UPDATE_SPAWN_DATE action', () => {
    let newState = reducer({}, {
      type: UPDATE_SPAWN_DATE,
      data: {
        startDate: moment().toObject(),
        endDate: moment().add(7, 'd').toObject()
      }
    });

    newState.spawnDate.startTime.should.be.a('object')
    newState.spawnDate.deadline.should.be.a('object')

  });

  it('should create a mission upon calling createMission', done => {
    const store = mockStore({})

    // the second MAT_BANK_ID should really be itemBankId, but that's okay for testing
    store.dispatch(createMission(TEST_MISSION, MAT_BANK_ID, directivesItemsMap, MAT_BANK_ID))
    .then( (res) => {
      newMission = _.assign({}, res)
      newMission.childIds.length.should.eql(directives.length)

      done()
    })
    .catch((err) => {
      // console.log(err)
    })
  })

  it('should update a mission upon calling updateMission', done => {
    const store = mockStore({})

    // the second MAT_BANK_ID should really be itemBankId, but that's okay for testing
    let newName = "foo"
    let updatedMissionForm = _.assign({}, newMission)
    updatedMissionForm.selectedDirectives = [{
      id: NEW_DIRECTIVE_ID
    }]
    updatedMissionForm.displayName = newName
    updatedMissionForm.startTime = moment().add(1, 'years')
    updatedMissionForm.deadline = moment().add({days: 30, years: 1})
    updatedMissionForm.assessmentOfferedId = newMission.assessmentOfferedId

    store.dispatch(updateMission(updatedMissionForm, MAT_BANK_ID, directivesItemsMap, MAT_BANK_ID))
    .then( (res) => {
      let updatedMission = res
      updatedMission.childIds.length.should.eql(1)
      updatedMission.displayName.text.should.eql(newName)
      updatedMission.startTime.year().should.eql(newMission.startTime.year() + 1)
      updatedMission.deadline.year().should.eql(newMission.deadline.year() + 1)
      updatedMission.sections.length.should.eql(1)
      updatedMission.sections[0].learningObjectiveId.should.eql(NEW_DIRECTIVE_ID)
      updatedMission.sections[0].childIds.length.should.eql(3)  // half of the 6 available
      done()
    })
    .catch((err) => {
      // console.log(err)
    })
  })

  it('should delete a mission upon calling deleteMission', done => {
    const store = mockStore({})
    // console.log("new mission", newMission)
    store.dispatch(deleteMission(newMission, MAT_BANK_ID))
    .then((res) => {
      return chai.request(BASE_URL)
      .get(`/middleman/banks/${MAT_BANK_ID}/missions/${newMission.id}`)
    })
    .then((res) => {
      res.should.have.status(500)
      done()
    })
    .catch((err) => {
      err.should.have.status(500)
      done()
    })
  })
})

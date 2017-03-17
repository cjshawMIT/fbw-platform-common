process.env.NODE_ENV = 'test'

import _ from 'lodash'
import Q from 'q'

import { authenticateD2LStudent } from '../reducers/Login/authenticateD2L'
import {logInUser} from '../reducers/Login/logInUser'
import {RECEIVE_MISSIONS, getMissions} from '../reducers/Mission/getMissions'
import {RECEIVE_CREATE_TAKE_MISSION, selectOpenMission} from '../reducers/Mission/selectOpenMission'
import { getSectionQuestions } from '../reducers/Mission/getSectionQuestions'
import {submitResponse} from '../reducers/Mission/submitResponse'

import thunk from 'redux-thunk'
import configureMockStore from 'redux-mock-store'
const middlewares = [ thunk ]
const mockStore = configureMockStore(middlewares)
import sinon from 'sinon'

let chai = require('chai');
const chaiHttp = require('chai-http');

let should = require('should');
chai.should();
chai.use(chaiHttp);

const MAT_BANK_ID = 'assessment.Bank%3A58498ccb71e482e47e0ed8ce%40bazzim.MIT.EDU';
const TEST_MISSION_ID = 'assessment.Assessment%3A587da23a71e48213e43f97b2%40bazzim.MIT.EDU'  // DEMO_TUTORIAL_MISSION
const TEST_MISSION_OFFERED_ID = 'assessment.AssessmentOffered%3A587da23b71e48213e63ba8c5%40bazzim.MIT.EDU'  // DEMO_TUTORIAL_MISSION

const BASE_URL = process.env.TEST_BACKEND || 'example.com';

const UNIQUE_USERNAME = Math.floor(new Date().getTime()).toString()
const FAKE_SCHOOL = "testing"
const LOGGED_IN_USERNAME = `${UNIQUE_USERNAME}@${FAKE_SCHOOL}.edu`

const PRIVATE_BANK_ALIAS = `assessment.Bank%3A58498ccb71e482e47e0ed8ce-${UNIQUE_USERNAME}.${FAKE_SCHOOL}.edu%40ODL.MIT.EDU`

let PRIVATE_BANK
let SECTION_ID
let CHOICE_ID
let QUESTION_ID

function dblEncodedUsername(username) {
  return encodeURIComponent(encodeURIComponent(username))
}


// describe statements should state the intent of this whole spec file
describe('student web app', function() {
  this.timeout(1000*20);

  it('should not allow unauthorized students to make qbank calls', function (done) {
    // just verify that students without qbank authz cannot
    // hasBasicAuthz, as a contrast against the next `it` block
    chai.request(BASE_URL)
    .get(`/middleman/hasBasicAuthz`)
    .set('x-fbw-username', LOGGED_IN_USERNAME)
    .end((err, res) => {
      res.should.have.status(403);
      done();
    })
  })

  it('should create basic qbank authorizations upon LOGIN', function (done) {
    // which means that you should be able to make calls
    // under that proxyname to something like, hasBasicAuthz
    const store = mockStore({})

    store.dispatch(logInUser(FAKE_SCHOOL, UNIQUE_USERNAME))
    .then( () => {
      return chai.request(BASE_URL)
      .get(`/middleman/hasBasicAuthz`)
      .set('x-fbw-username', LOGGED_IN_USERNAME)
    })
    .then((res) => {
      res.should.have.status(200)
      done()
    })
    .catch((err) => {
      // console.log(err)
    })
  })

  it('should create / retrieve the private bank when calling authenticateD2LStudent and create authz', function(done) {
    // You can now make middleman calls to getMission (which
    //   calculates the privateBankId for you)
    const mockUrl = 'd2l-callback?x_a=94Uf24iaW4SWpQMzFvsMrH&x_b=uq9naj95YZ2bOzgZ8se69m&x_c=66IANU-TLdAJDIOmfvygR1tA110eoQe-bYdMFldm5rA';
    let credentials = _.assign({}, require('../d2lcredentials'), {
      role: 'student'
    })

    const store = mockStore({
      login: {
        user: {
          username: LOGGED_IN_USERNAME
        },
        isLoggedIn: true,
        isVisitor: false
      }
    })

    store.dispatch(authenticateD2LStudent(credentials, mockUrl, LOGGED_IN_USERNAME))
    .then( () => {
      // this action should set up the private bank
      return chai.request(BASE_URL)
      .get(`/middleman/banks/${PRIVATE_BANK_ALIAS}`)
    })
    .then((res) => {
      res.should.have.status(200);
      PRIVATE_BANK = JSON.parse(res.text)
      done();
    })
    .catch((err) => {
      // console.log(err)
    })
  })

  it('should be able to select an open mission, i.e. get a taken with sections only', done => {
    const store = mockStore({});
    const dispatch = sinon.spy(store, 'dispatch');
    const expectedAction = {
      type: RECEIVE_CREATE_TAKE_MISSION,
      mission: 'foobaz'
    }

    // so here, you'll manually mock in the data that's required, e.g.
    let data = {
      bankId: MAT_BANK_ID,
      mission: {
        assessmentOfferedId: TEST_MISSION_OFFERED_ID
      },
      username: LOGGED_IN_USERNAME,
    };

    // ======
    //  so this part asserts that the real middleman gave back correct data
    // ======
    store.dispatch(selectOpenMission(data))
    .then( (res) => {
      let assessmentSections = res;

      _.every(assessmentSections, section => {
        section.questions.should.be.a('array');
        // section.questions.length.should.be.at.least(1);
        section.questions.length.should.be.equal(0);
      });

      SECTION_ID = assessmentSections[0].id
      // ======
      //   this part asserts that the receive action was called.
      // ======
      dispatch.calledWith(expectedAction)

      done()
    });
  })

  it('should be able to get questions, for a section', done => {
    const store = mockStore({});
    const dispatch = sinon.spy(store, 'dispatch');

    // so here, you'll manually mock in the data that's required, e.g.
    let data = {
      bankId: MAT_BANK_ID,
      sectionId: SECTION_ID,
      username: LOGGED_IN_USERNAME,
    };

    // ======
    //  so this part asserts that the real middleman gave back correct data
    // ======
    store.dispatch(getSectionQuestions(data))
    .then( (res) => {
      let questions = res;

      questions.length.should.be.at.least(1);

      QUESTION_ID = questions[0].id
      // don't know if this is right or wrong
      CHOICE_ID = questions[0].choices[0].id
      done()
    });
  })

  it('should be able to submit a response to an open mission', done => {
    const store = mockStore({});
    // so here, you'll manually mock in the data that's required, e.g.
    let data = {
      bankId: MAT_BANK_ID,
      section: {
        id: SECTION_ID
      },
      questionId: QUESTION_ID,
      choiceId: CHOICE_ID,
      username: LOGGED_IN_USERNAME,
    };

    // ======
    //  so this part asserts that the real middleman gave back correct data
    // ======
    store.dispatch(submitResponse(data))
    .then( (res) => {
      let response = res;
      response.should.have.property('isCorrect')
      response.should.have.property('confusedLearningObjectiveIds')
      response.should.have.property('feedback')
      response.should.have.property('choiceIds')
      done()
    })
  })

  function cleanUpPromise(student) {
    // console.log('cleaning up for', student);
    let privateBank
    // to clean up, need to grab the actual private bank id
    return chai.request(BASE_URL)
    .get(`/middleman/banks/${PRIVATE_BANK_ALIAS}`)
    .then((res) => {
      res.should.have.status(200);
      privateBank = JSON.parse(res.text)
      // then delete just this user's taken...
      return chai.request(BASE_URL)
      .get(`/middleman/banks/${privateBank.id}/missions/${TEST_MISSION_ID}/takens`)
    })
    .then((res) => {
      res.should.have.status(200)
      let takens = JSON.parse(res.text)
      let myTaken = _.find(takens, (taken) => {
        return taken.takingAgentId.indexOf(dblEncodedUsername(student)) >= 0;
      })
      return chai.request(BASE_URL)
      .delete(`/middleman/banks/${MAT_BANK_ID}/missions/${TEST_MISSION_ID}/takens/${myTaken.id}`)
    })
    .then((res) => {
      return chai.request(BASE_URL)
      .delete(`/middleman/banks/${privateBank.id}`)
    })
    .then( (res) => {
      res.should.have.status(200);

      return chai.request(BASE_URL)
      .delete(`/middleman/authorizations`)
      .set('x-fbw-username', LOGGED_IN_USERNAME)
    })
    .then( (res) => {
      res.should.have.status(200)
      return Q.when('')
    })
    .catch( (err) => {
      // console.log(err);
    })
  }

  // clean up all the newly-created authorizations, banks, and missions
  after( function(done) {
    this.timeout(20000);

    cleanUpPromise(LOGGED_IN_USERNAME)
    .then( res => {
      // console.log('cleaned up for all newly created students');

      done();
    })
  })
})

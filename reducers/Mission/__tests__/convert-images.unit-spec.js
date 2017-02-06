process.env.NODE_ENV = 'test'

import _ from 'lodash'
import axios from 'axios'

import {selectOpenMission} from '../selectOpenMission'
import {selectClosedMission} from '../selectClosedMission'
import {submitResponse} from '../submitResponse'
import {showAnswer} from '../showAnswer'

import {createBaseQBankStudentAuthorizations} from '../../Login/logInUser'
import {selectBank} from '../../Bank/selectBank'

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

const ALGEBRA_BANK_ID = 'assessment.Bank%3A576d6d3271e4828c441d721a%40bazzim.MIT.EDU';
const ACCOUNTING_BANK_ID = 'assessment.Bank%3A57d70ed471e482a74879349a%40bazzim.MIT.EDU';

// const STUDENT_ID = 'LUWEEZY@fbw-visitor.edu'
// const PRIVATE_ALGEBRA_BANK_ID = 'assessment.Bank%3A5850599e71e4824fcc9d345f%40bazzim.MIT.EDU'
// const ASSIGNED_BANK_ID = "assessment.Bank%3A581a39cd71e4822fa62c96cd%40bazzim.MIT.EDU";
const OFFERED_ID = "assessment.AssessmentOffered%3A5855473871e4823bce25a7fd%40bazzim.MIT.EDU";    // the internal test mission
// const SECTION_ID = "assessment.AssessmentSection%3A5855518171e4823bce25aa7f%40bazzim.MIT.EDU";    // the first directive: if two lines are parallel

// for testing closed missions
const STUDENT_ID_2 = 'I01791513@acc.edu'
const OFFERED_ID_2 = "assessment.AssessmentOffered%3A57fd15ab71e48240ccf2c09d%40bazzim.MIT.EDU"

// for testing image in reponse feedback solution
// to be used with LUWEEZY
// const SECTION_ID_2 = "assessment.AssessmentSection%3A5882769c71e48271b25c3c52%40bazzim.MIT.EDU"
// const WRONG_QUESTION_ID = "assessment.Item%3A5882769c71e48271b25c3c5f%40assessment-session";
// const WRONG_CHOICE_ID = "57f5353c71e482499fa84275";
// const SHOW_ANSWER_SECTION_ID = "assessment.AssessmentSection%3A57ffaea371e48240ccf2c8fa%40bazzim.MIT.EDU"
// const SHOW_ANSWER_QUESTION_ID = "assessment.Item%3A57ffaea371e48240ccf2c8fc%40assessment-session"

//  To test images
const STUDENT_ID = 'Mxxxxxxx-Mxxxxxxx Axxxxxxx-1xxxxxxx@fbw-visitor.edu'
const SECTION_ID = "assessment.AssessmentSection%3A58989a7871e48280348ce94e%40bazzim.MIT.EDU";    // the first directive: if two lines are parallel
const SECTION_ID_2 = "assessment.AssessmentSection%3A58989a7871e48280348ce956%40bazzim.MIT.EDU"
const WRONG_QUESTION_ID = "assessment.Item%3A58989a7971e48280348ce974%40assessment-session";
const WRONG_CHOICE_ID = "583f020971e482974e516fae";
const SHOW_ANSWER_SECTION_ID = "assessment.AssessmentSection%3A58989dd171e48280353954b5%40bazzim.MIT.EDU"
const SHOW_ANSWER_QUESTION_ID = "assessment.Item%3A58989dd271e48280353954c2%40assessment-session"


// describe statements should state the intent of this whole spec file
describe('convert image paths utility method', function() {
  this.timeout(1000*10);

  before((done) => {
    // need to make sure the authz is set up for our M test user, which
    //   is not possible to do via UI, because the UI strips out
    //   whitespace from visitor usernames
    createBaseQBankStudentAuthorizations(STUDENT_ID)
    .then(() => {
      const store = mockStore({});

      return store.dispatch(selectBank({id: ALGEBRA_BANK_ID}, STUDENT_ID))
    })
    .then(() => {
      done()
    })
  })

  it('should be invoked for getting an open mission', function (done) {
    // verify that getting a mission with images in the questions
    // includes CloudFront URLs, not MC3 URLs.
    const store = mockStore({});
    let data = {
      bankId: ALGEBRA_BANK_ID,
      mission: {
        assessmentOfferedId: OFFERED_ID
      },
      username: STUDENT_ID,
    };

    // ======
    //  so this part asserts that the real middleman gave back correct data
    // ======
    store.dispatch(selectOpenMission(data))
    .then( (res) => {
      let assessmentSections = JSON.stringify(res)
      assessmentSections.should.contain('cloudfront');
      assessmentSections.should.not.contain('mc3.mit.edu');
      done()
    });
  })

  it('should be invoked for getting a closed mission', function (done) {
    // verify that getting a mission with images in the questions
    // includes CloudFront URLs, not MC3 URLs. When it's a closed mission.
    const store = mockStore({});
    let data = {
      bankId: ALGEBRA_BANK_ID,
      mission: {
        assessmentOfferedId: OFFERED_ID_2
      },
      username: STUDENT_ID_2,
    };

    // ======
    //  so this part asserts that the real middleman gave back correct data
    // ======
    store.dispatch(selectClosedMission(data))
    .then( (res) => {
      let assessmentSections = JSON.stringify(res)
      assessmentSections.should.contain('cloudfront');
      assessmentSections.should.not.contain('mc3.mit.edu');
      done()
    })
    .catch((err) => {
      console.log(err)
    });
  })

  it('should be invoked after submitting a response', function(done) {
    // verify that getting a mission with images in the questions
    // includes CloudFront URLs, not MC3 URLs.
    const store = mockStore({});
    let data = {
      bankId: ALGEBRA_BANK_ID,
      section: {
        id: SECTION_ID_2
      },
      questionId: WRONG_QUESTION_ID,
      choiceId: WRONG_CHOICE_ID,
      username: STUDENT_ID,
    };

    // ======
    //  so this part asserts that the real middleman gave back correct data
    // ======
    store.dispatch(submitResponse(data))
    .then( (res) => {
      let response = JSON.stringify(res)
      response.should.contain('cloudfront');
      response.should.not.contain('mc3.mit.edu');
      done()
    });
  })

  it('should be invoked for show answer', done => {
    const store = mockStore({});
    // so here, you'll manually mock in the data that's required, e.g.
    let data = {
      bankId: ALGEBRA_BANK_ID,
      section: {
        id: SHOW_ANSWER_SECTION_ID
      },
      questionId: SHOW_ANSWER_QUESTION_ID,
      username: STUDENT_ID,
    };

    // ======
    //  so this part asserts that the real middleman gave back correct data
    // ======
    store.dispatch(showAnswer(data))
    .then( (res) => {
      let response = JSON.stringify(res)
      response.should.contain('cloudfront');
      response.should.not.contain('mc3.mit.edu');
      done()
    });
  })

})

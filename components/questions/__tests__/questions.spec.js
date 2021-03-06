import React from 'react';

import {Provider} from 'react-redux'
import configureStore from 'redux-mock-store'

import QuestionsComponent from '../web/Questions';
import QuestionsContainer from '../QuestionsContainer'
const Questions = QuestionsContainer(QuestionsComponent)

import {mount, shallow} from 'enzyme';

import '../../../styles/foundation.min.css'
import '../../../styles/core.scss'
import '../../../styles/animations.scss'
import '../../../styles/common.css'

const STATE = require('./state.mock.json')

let chai = require('chai')
chai.should()

describe('Questions', () => {

  let mockStore = configureStore([]);
  let connectedQuestions, store;

  before(function() {
    const div = global.document.createElement('div');
    global.document.body.appendChild(div);

    store = mockStore(STATE);
    connectedQuestions = mount(
      <Provider store={store}>
        <Questions  />
      </Provider>,
      {attachTo: div}
    );
  });

  it('should render a list of 2 answered question cards and 1 pristine card for an over mission', () => {
    const questions = connectedQuestions.find(Questions)

    // questions.props().questions.length.should.be.eql(3);
    questions.find('.question-card').length.should.be.eql(3);   // 3 questions total
    questions.find('.choice').length.should.be.eql(4);          // only 1 question is expanded
    questions.find('.is-selected').length.should.be.eql(0);     // no choices are expanded except for last one
    questions.find('.answered-question-cue').length.should.be.eql(2);     // no choices are expanded except for last one
    questions.find('.submit-button').length.should.be.eql(0);
  });



  after( () => {
    // connectedQuestions.detach();
  })
});

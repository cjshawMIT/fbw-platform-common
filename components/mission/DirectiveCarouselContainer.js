import _ from 'lodash'
import { connect } from 'react-redux'

import { getUser } from '../../selectors/'
import { getEnrolledSubject } from '../../selectors/bank'

import { getSectionQuestions } from '../../reducers/Mission/getSectionQuestions'

const mapStateToProps = (state, ownProps) => {
  return {
    user: getUser(state),
    bank: getEnrolledSubject(state),
    currentMissionSections: state.mission.currentMissionSections
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onGetSectionQuestions: data => dispatch(getSectionQuestions(data))
  }
}

const provider = (component) => {
  return connect(mapStateToProps, mapDispatchToProps)(component)
}

export default provider

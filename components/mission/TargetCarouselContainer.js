import _ from 'lodash'
import { connect } from 'react-redux'

import { isTarget } from '../../selectors/mission'
import { selectTarget } from '../../reducers/Mission/selectTarget'
import {getMapping} from '../../selectors'


const mapStateToProps = (state, ownProps) => {

  let targets;
  if (state.mission.currentMissionSections && state.mission.currentDirectiveIndex !== null) {
    // console.log('state in TargetCarouselContainer', state);
    let currentSection = state.mission.currentMissionSections[state.mission.currentDirectiveIndex]
    if (currentSection.questions) {
      let allQuestions = currentSection.questions
      targets = _.filter(allQuestions, isTarget)
    }
  }

  return {
    currentDirectiveIndex: state.mission.currentDirectiveIndex,  // used for tabIndex on web side
    currentTarget: state.mission.currentTarget,
    currentMissionSections: state.mission.currentMissionSections,
    targets: targets,
    outcomes: getMapping(state).outcomes ? getMapping(state).outcomes : []
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  return {
    onSelectTarget: data => dispatch(selectTarget(data))
  }
}

const provider = (component) => {
  return connect(mapStateToProps, mapDispatchToProps)(component)
}

export default provider

import { connect } from 'react-redux'
import slug from 'slug'

import _ from 'lodash'

import { getMissions } from '../../reducers/Mission/getMissions'
import { selectOpenMission } from '../../reducers/Mission/selectOpenMission'
import { selectClosedMission } from '../../reducers/Mission/selectClosedMission'
import { selectDirective } from '../../reducers/Mission/selectDirective'

import {getUser, getMapping} from '../../selectors/'
import {getEnrolledSubject} from '../../selectors/bank'
import {directivesFromSections, isTarget, isTargetRouteNavigated} from '../../selectors/mission'


const mapStateToProps = (state, ownProps) => {
  // console.log('ownProps of MissionContainer', ownProps)
  console.log('state in MissionContainer', state);

  let outcomes = getMapping(state) ? getMapping(state).outcomes : [];
  let directives = directivesFromSections(state.mission.currentMissionSections, outcomes);

  return {
    user: getUser(state),
    bank: getEnrolledSubject(state),
    missions: state.mission ? state.mission.missions : null,
    missionName: ownProps.params ? ownProps.params.missionName : null,
    mission: ownProps.params && state.mission.missions ?
              _.find(state.mission.missions, m => slug(m.displayName.text) === slug(ownProps.params.missionName)) :
              null,
    currentMissionSections: state.mission.currentMissionSections,
    directives,
    directiveIndicators: _.map(directives, (d, idx) => {
      let section = state.mission.currentMissionSections[idx];
      let navigatedTargets = [];
      let targetsForDirective = [];
      if (section && section.questions) {
        targetsForDirective = _.filter(section.questions, isTarget);
        navigatedTargets = _.filter(targetsForDirective, question => isTargetRouteNavigated(question, section.questions) || question.isCorrect);
      }
      // console.log('section', section);
      // console.log('targetsForDirective', targetsForDirective);
      // console.log('navigatedTargets', navigatedTargets);

      return {
        numerator: navigatedTargets.length,
        denominator: targetsForDirective.length,
      }
    }),
    currentDirectiveIndex: typeof state.mission.currentDirectiveIndex !== 'undefined' ? state.mission.currentDirectiveIndex : null,
    hasResults: typeof state.mission.resultsExistForUser !== 'undefined' ? state.mission.resultsExistForUser : null,
    isGetMissionsInProgress: state.mission ? state.mission.isGetMissionsInProgress : false,
    isSubmitTakeMissionInProgress: state.mission ? state.mission.isSubmitTakeMissionInProgress : false
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  // This seems redundant with MissionsContainer, but I think we need it
  //   in order to handle the "load specific mission page" scenario on the
  //   web side...basically the Mission component will need to load its
  //   own mission.
  return {
    onSelectOpenMission: data => dispatch(selectOpenMission(data)),
    onSelectClosedMission: data => dispatch(selectClosedMission(data)),
    getMissions: data => dispatch(getMissions(data)),
    onSelectDirective: directiveIndex => dispatch(selectDirective(directiveIndex))
  }
}

const provider = (component) => {
  return connect(mapStateToProps, mapDispatchToProps)(component)
}

export default provider

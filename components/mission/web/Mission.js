import React, {Component} from 'react'
import Spinner from 'react-spinner'
import slug from 'slug'

import DirectiveCarouselContainer from '../DirectiveCarouselContainer'
import DirectiveCarouselComponent from './DirectiveCarousel'
const DirectiveCarousel = DirectiveCarouselContainer(DirectiveCarouselComponent)

import TargetCarouselContainer from '../TargetCarouselContainer'
import TargetCarouselComponent from './TargetCarousel'
const TargetCarousel = TargetCarouselContainer(TargetCarouselComponent)

import QuestionsContainer from '../../questions/QuestionsContainer'
import QuestionsComponent from '../../questions/web/Questions'
const Questions = QuestionsContainer(QuestionsComponent)

import {checkMissionStatus } from '../../../utilities/time'

import './Mission.scss'
const styles = {
  container: {
    height: '100%'
  }
}

class Mission extends Component {
  componentDidMount() {
  }

  componentDidUpdate() {
    // someone just pastes in /missions/MISSION-NAME
    if (this.props.bank &&
        !this.props.mission &&
        !this.props.missions &&
        !this.props.isGetMissionsInProgress) {
      this.props.getMissions({
        bankId: this.props.bank.id,
        username: this.props.user.username
      })
    }

    if (!this.props.isGetMissionsInProgress && this.props.missions && this.props.mission) {
      let missionState = checkMissionStatus(this.props.mission)
      let data = {
        mission: this.props.mission,
        username: this.props.username
      }
      if (!this.props.isSubmitTakeMissionInProgress &&
          !this.props.currentMissionSections &&
          missionState !== "over") {
        console.log('getting an open mission')
        this.props.onSelectOpenMission(data);

      } else if (!this.props.isSubmitTakeMissionInProgress &&
          missionState === "over" &&
          typeof this.props.hasResults === "undefined") {
        console.log('getting a closed mission')
        console.log(this.props)
        this.props.onSelectClosedMission(data)
      }
    }
  }

  render() {
    if (this.props.mission) {
      let missionState = checkMissionStatus(this.props.mission)
      if (!this.props.hasResults && missionState === "over") {
        return (<div style={[styles.container, {paddingTop: 80, paddingLeft: 30}]}>
          <div>You did not participate in this mission, so you have no results.</div>
        </div>)
      }
    }

    let loadingIndicator;
    if (this.props.isSubmitTakeMissionInProgress) {
      loadingIndicator = <Spinner/>
    }

    console.log('Mission.props', this.props)

    return (
      <div>
        <nav role="navigation" aria-label="Directives Menu">
          <DirectiveCarousel directives={this.props.directives}
                             currentDirectiveIndex={this.props.currentDirectiveIndex}
                             directiveIndicators={this.props.directiveIndicators}
                             onSelectDirective={this.props.onSelectDirective}
                             viewOnly={this.props.viewOnly}/>
        </nav>
        <nav className="nav-target-carousel" role="navigation" aria-label="Target Questions Menu">
          <TargetCarousel />
        </nav>
        <main>
          <Questions viewOnly={this.props.viewOnly}/>
        </main>

        {loadingIndicator}
      </div>
    )
  }

}

export default Mission

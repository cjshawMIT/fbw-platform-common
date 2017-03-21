'use strict'

import React, {Component} from 'react'
import _ from 'lodash'

import { hasAchievedDirective } from '../../../selectors/mission'
import './DirectiveCarousel.scss'

class DirectiveCarousel extends Component {

  _renderThumb = (directive, idx) => {
    // let outcome = _.find(this.props.outcomes, {id: directive.learningObjectiveId})

    let indicatorText;
    if (this.props.directiveIndicators) {
      let indicator = this.props.directiveIndicators[idx];
      if (indicator.denominator !== 0) {
        indicatorText = `${indicator.numerator || '--'}/${indicator.denominator}`;
      }
    }

    let displayName = directive ? directive.displayName.text : 'Error. Somehow this outcome is undefined';

    // let isActive = idx === this.props.currentDirectiveIndex;
    // force user to tap on a directive -- because the IDs
    // returned initially by takeMission?sectionsOnly are un-takable IDs.
    let isActive = this.props.currentDirectiveIndex !== null ? idx === this.props.currentDirectiveIndex : false;
    let thumb = (
      <div key={idx}
          className={isActive ? "carousel-thumb is-active carousel-thumb--directive" : "carousel-thumb carousel-thumb--directive"}>
        <button className="carousel-thumb__button" onClick={() => this._onSelectDirective(idx)}
                aria-label={`Learning Outcome: ${displayName}`}>
          <div className="flex-container align-bottom space-between prewrap">
            <span className="carousel-thumb__icon">{indicatorText}</span>
            <p className="carousel-thumb__text">{displayName}</p>
          </div>
        </button>
      </div>
    )

    return thumb;
  }

  render() {
    // let loadingBox;
    // if (!this.props.directives) {
    //   loadingBox = (
    //     <LoadingBox type="enter-active"/>
    //   )
    // } else {
    //   loadingBox = (
    //     <LoadingBox type="enter"/>
    //   )
    // }

    // console.log('DirectivesCarousel props', this.props)

    let directivesCarousel;
    if (this.props.directives && this.props.directives.length > 0) {
      directivesCarousel = (
        <div className="carousel-container directive-carousel">
          <div className="carousel flex-container align-center">
            {_.map(this.props.directives, this._renderThumb)}
          </div>
        </div>
      )
    }

    return (
      <div className="">
        {directivesCarousel}
      </div>

    )
  }

  _onSelectDirective = (directiveIndex) => {
    if (this.props.currentMissionSections && !this.props.viewOnly) {
      // for instructor view, this isn't enabled
      this.props.onGetSectionQuestions({
        bankId: this.props.bank.id,
        sectionId: this.props.currentMissionSections[directiveIndex].id,
        username: this.props.user.username
      });
    }
    this.props.onSelectDirective(directiveIndex);
  }
}

export default DirectiveCarousel

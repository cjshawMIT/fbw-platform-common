import _ from 'lodash'

export const directivesFromSections = (sections, outcomes) => {
  let objectiveIds = _.map(sections, 'learningObjectiveId');

  return _.map(objectiveIds, lo => _.find(outcomes, o => o.id == lo));
}


export const isTarget = (question) => {
  if (question && question.displayName) {
    return question.displayName.text.indexOf('.') < 0;
  }

  return undefined;
}

export const targetKey = (target) => {
  return target ? target.displayName.text[0] : null;
}

export const isTargetRouteNavigated = (target, questions) => {
  if (!questions || questions.length === 0) {
    throw new Error('No questions of the route were provided')
    return false;
  }

  if (!target) {
    throw new Error('No target question provided');
    return false;
  }

  let key = targetKey(target);
  let questionsInRoute = _.filter(questions, question => question.displayName.text.startsWith(key));  // in case

  // a route is navigated only when all of the Targets waypoints have been responded correctly

  let hasNavigated = false;
  if (questionsInRoute[0].response && !questionsInRoute[0].response.isCorrect) {
    let lastQuestion = _.takeRight(questionsInRoute)[0];
    hasNavigated = lastQuestion.response && lastQuestion.response.isCorrect;
  }

  return hasNavigated;
}

export const targetStatus = (target, questionsInRoute) => {
  var status = 'PRISTINE';

  if (isTargetRouteNavigated(target, questionsInRoute) && !target.isCorrect) {
    status = 'NAVIGATED';

  } else if (target.responded && target.isCorrect) {
    status = 'COMPLETE';
  } else if (target.responded && !target.isCorrect) {
    status = 'FAIL';
  }

  return status;
}

export const filterItemsByTarget = (items) => {
  return _.reduce(items, (result, item) => {
    let itemKey = targetKey(item);

    if (!itemKey) return null;

    if (!result[itemKey]) result[itemKey] = [];
    result[itemKey].push(item);

    return result;
  }, {});
}

export function getTargetQuestions (state) {
  let questions
  if (state.mission.currentTarget && state.mission.currentMissionSections) {
    const currentDirective = state.mission.currentMissionSections[state.mission.currentDirectiveIndex];
    if (currentDirective && currentDirective.questions) {
      let directiveQuestions = currentDirective.questions
      let routeQuestions = filterItemsByTarget(directiveQuestions)
      questions = routeQuestions[targetKey(state.mission.currentTarget)]
    }
  }
  return questions
}


export const directiveIdsFromQuestions = (questionsData) => {
  return _.map(questionsData, (section, index) => section.learningObjectiveId);
}


// export function hasAchievedDirective (targets) {
//   if (!targets) return null;
//
//   let min = Math.ceil(targets.length / 2);
//
//   let numResponded = 0;
//   let numCorrect = _.reduce(targets, (result, question) => {
//     if (question.responded) numResponded++;
//     if (question.isCorrect) result+=1;
//     return result;
//   }, 0)
//
//   if (numResponded === targets.length && numCorrect < min) return false;
//
//   if (numCorrect >= min) return true;
// }

export function sortItemsByModules(modules, items) {
  var moduleItems = {};
  _.each(modules, function (module) {
    moduleItems[module.id] = {
      displayName: module.displayName.text,
      items: []
    };
  });

  _.each(modules, function (module) {
    var outcomeIds = _.map(module.childNodes, 'id');
    _.each(items, function (item) {
      if (outcomeIds.indexOf(item.learningObjectiveIds[0]) >= 0) {
        moduleItems[module.id]['items'].push(item);
      }
    });
  });

  return moduleItems
};

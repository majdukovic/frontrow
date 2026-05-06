'use strict';

/**
 * Flag interactive components that don't expose a testID. The whole app
 * relies on testIds.ts as the single source of truth for end-to-end tests,
 * so any tappable surface that ships without one is a silent gap in QA
 * coverage.
 *
 * Heuristic: warn on JSX whose tag matches one of the well-known
 * interactive components OR ends in `Button` and has an `onPress` prop —
 * we miss the occasional custom abstraction that doesn't, but those
 * rarely render in production paths.
 */
const INTERACTIVE = new Set([
  'Pressable',
  'TouchableOpacity',
  'TouchableHighlight',
  'TouchableWithoutFeedback',
  'TouchableNativeFeedback',
  'Button',
  'Switch',
]);

function getName(opening) {
  const name = opening.name;
  if (name.type === 'JSXIdentifier') return name.name;
  if (name.type === 'JSXMemberExpression') {
    return name.property.type === 'JSXIdentifier' ? name.property.name : null;
  }
  return null;
}

function hasProp(opening, propName) {
  return opening.attributes.some(
    (a) => a.type === 'JSXAttribute' && a.name && a.name.name === propName,
  );
}

function hasSpread(opening) {
  return opening.attributes.some((a) => a.type === 'JSXSpreadAttribute');
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require a testID on interactive components',
      recommended: false,
    },
    schema: [],
    messages: {
      missing:
        '<{{name}}> needs a `testID` (use src/testIds.ts so QA can target this surface).',
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        const name = getName(node);
        if (!name) return;
        const isInteractive =
          INTERACTIVE.has(name) || (name.endsWith('Button') && hasProp(node, 'onPress'));
        if (!isInteractive) return;
        if (hasProp(node, 'testID')) return;
        // A spread (`{...rest}`) may forward testID — don't warn in that case.
        if (hasSpread(node)) return;
        context.report({ node, messageId: 'missing', data: { name } });
      },
    };
  },
};

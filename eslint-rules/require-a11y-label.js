'use strict';

/**
 * Flag interactive components that don't expose a screen-reader label.
 * Mirror of frontrow/require-testid: same component set, but enforces
 * accessibilityLabel (or visible text content for components that derive
 * a label from children, like our wrapped <Button title="Buy" />).
 *
 * The lint rule isn't a substitute for manual a11y review — it just
 * catches the obvious gap of an icon-only Pressable.
 */
const INTERACTIVE = new Set([
  'Pressable',
  'TouchableOpacity',
  'TouchableHighlight',
  'TouchableWithoutFeedback',
  'TouchableNativeFeedback',
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
      description: 'Require an accessibilityLabel on interactive components',
      recommended: false,
    },
    schema: [],
    messages: {
      missing:
        '<{{name}}> needs an `accessibilityLabel` so screen-readers and Maestro can target it by label.',
    },
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        const name = getName(node);
        if (!name) return;
        if (!INTERACTIVE.has(name)) return;
        if (hasProp(node, 'accessibilityLabel')) return;
        if (hasProp(node, 'aria-label')) return;
        if (hasSpread(node)) return;
        // accessible={false} explicitly opts out — fine, the screen reader
        // will skip and Maestro can use testID for that case.
        const accessibleAttr = node.attributes.find(
          (a) => a.type === 'JSXAttribute' && a.name && a.name.name === 'accessible',
        );
        if (
          accessibleAttr &&
          accessibleAttr.value &&
          accessibleAttr.value.type === 'JSXExpressionContainer' &&
          accessibleAttr.value.expression.type === 'Literal' &&
          accessibleAttr.value.expression.value === false
        ) {
          return;
        }
        context.report({ node, messageId: 'missing', data: { name } });
      },
    };
  },
};

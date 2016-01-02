const R = require('ramda');
const functions = require('./functions');
const
  get = functions.get,
  getDefault = functions.getDefault,
  getPath = functions.getPath,
  getPathDefault = functions.getPathDefault,
  update = functions.update,
  updatePath = functions.updatePath,
  shuffle = functions.shuffle,
  removeAtIndex = functions.removeAtIndex;

const jsAtom = require('js-atom');

/**
 * There are 3 1s, 2 2s, 2 3s, 2 4s, 1 5.
 */
const DEFAULT_WEIGHTS = [ [1, 1], [2, 1], [3, 1], [4, 1], [5, 1] ];
/**
 * The default colours are red, blue, yellow, white and green
 * @type {Array}
 */
const DEFAULT_COLOURS = ['red', 'blue', 'yellow', 'white', 'green'];

// main app state
const gameState = jsAtom.createAtom();

/**
 * Generate a shuffled deck, of the form
 * eg. [ { colour: 'red', number: 1 } ]
 */
function generateDeck(seed) {
  const weights = DEFAULT_WEIGHTS;
  const colours = DEFAULT_COLOURS;
  // generate a list of the numbers, weighted
  // [1, 1, 1, 2, 2, 3, 3, 4, 4, 5]
  const nums = R.flatten(R.map(w => R.repeat(w[0], w[1]), weights));
  // xprod will do a permutation of all combinations of numbers and colours
  // zipObj: [['number', 'colour'], [1, 'red']] => { number: 1, colour: 'red' }
  const deck = R.map(R.zipObj(['number', 'colour']), R.xprod(nums, colours));
  // shuffle
  return shuffle(seed, deck);
}

// make { red: [], blue: [], etc. }
function makeStacks() {
  return R.zipObj(DEFAULT_COLOURS, R.repeat([], DEFAULT_COLOURS.length));
}

// generate main game state
function makeGameState(seed) {
  return {
    // players
    players: {},
    currentlyPlaying: 0,

    gameOver: false,
    // resources
    lives: 3,
    info: 8,
    infoMode: 'neither',

    // cards
    deck: generateDeck(seed),
    discard: [],
    stacks: makeStacks()
  };
}

// game state functions
const removeLife = update('lives', R.compose(R.max(0), R.dec));

const addInfo = update('info', R.compose(R.min(8), R.inc));
const removeInfo = update('info', R.dec);

const setInfoModeToColour = R.assoc('infoMode', 'colour');
const setInfoModeToNumber = R.assoc('infoMode', 'number');
const getInfoMode = get('infoMode');

// stack functions
const getTopOfStack = colour => getPath(['stacks', colour, 0]);
const putOnStack = R.curry((colour, number) => updatePath(['stacks', colour], R.prepend(number)));
const isValidMove = R.curry((card, state) => {
  const topOfStack = getTopOfStack(card.colour)(state);
  return topOfStack === null && card.number === 1 || topOfStack === card.number - 1
});

// players functions
function makePlayer(name) {
  return {
    name: name,
    ready: false,
    cards: [],
    knownColours: [],
    knownNumbers: []
  };
}
const addPlayer = name => update('players', R.assoc(name, makePlayer(name)));
const removePlayer = name => update('players', R.dissoc(name));
const addCardTo = R.curry((name, card) => updatePath(['players', name, 'cards'], R.append(card)));
const removeCardFrom = R.curry((name, i) => updatePath(['players', name, 'cards'], removeAtIndex(i)));
const getCardAt = R.curry((name, card) => getPath(['players', name, 'cards', card]));
const getPlayers = R.compose(Object.keys, getPath(['players']));

const addKnownColour = R.curry((name, colour) =>
  updatePath(
    ['players', name, 'knownColours'],
    R.compose(R.uniq, R.append(colour))
  )
);
const addKnownNumber = R.curry((name, number) =>
  updatePath(
    ['players', name, 'knownNumbers'],
    R.compose(R.uniq, R.append(number))
  )
);

// cards
const peekDeck = getPath(['deck', 0]);
const popDeck = update('deck', R.tail);

const addToDiscard = card => update('discard', R.append(card));
const dealTo = R.curry(
  (name, state) =>
    R.compose(
      addCardTo(name, peekDeck(state)),
      popDeck
    )(state)
);

// deal to each player n cards
const dealCards = R.curry((n, state) => {
  const players = getPlayers(state);
  const ps = R.flatten(R.repeat(players, n));
  R.forEach(name => dealTo(name, state), ps);
  return state;
});

// (1) DISCARD
const discard = R.curry((player, card, state) => {
  const cardObj = getCardAt(player, card)(state);

  return R.compose(
    addToDiscard(cardObj),
    removeCardFrom(player, card),
    dealTo(player),
    addInfo
  )(state);
});

// (2) PLAY
const play = R.curry((player, card, state) => {
  var fn = R.identity;
  if(isValidMove(getCardAt(player, card)(state), state)) {
    fn = R.compose(
      putOnStack(cardObj.colour, cardObj.number),

      // same for both
      removeCardFrom(player, card),
      dealTo(player)
    );
  } else {
    fn = R.compose(
      addToDiscard(cardObj),
      removeLife,

      // same for both
      removeCardFrom(player, card),
      dealTo(player)
    );
  }

  return fn(state);
});

// (3) Give Info To
const giveInfo = R.curry((player, state) => {
  const currentMode = getInfoMode(state);

  return R.compose(

  );
});

// room state functions
function updateState(f) {
  gameState.swap(f);
}

// addPlayer('nick'));
// addPlayer('nick2'));
// addPlayer('nick3'));
// addPlayer('nick4'));
// dealCards(5);
// play('nick4', 0);
// printgameState();

module.exports = {
  current() {
    return gameState.deref();
  },
  reset(seed) {
    gameState.reset(makeGameState(seed));
  },
  start() {
    updateState(dealCards(5));
  },
  addPlayer(name) {
    updateState(addPlayer(name));
  },
  removePlayer(name) {
    updateState(removePlayer(name));
  },
  play(player, card) {
    updateState(play(player, card));
  },
  discard(player, card) {
    updateState(discard(player, card));
  }
};

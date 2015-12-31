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
 * The default colours are red, blu, yellow and white
 * @type {Array}
 */
const DEFAULT_COLOURS = ['red', 'blue', 'yellow', 'white', 'green'];

// app state stuff
const appState = jsAtom.createAtom({
  rooms: []
});

/**
 * Log the current state of atom.
 */
function printAppState() {
  console.log('=================================================');
  console.dir(appState.deref(), { colors: true, depth: null });
  console.log('=================================================');
}

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

// make { red: [], blue: [] }
function makeStacks() {
  return R.zipObj(DEFAULT_COLOURS, R.repeat([], DEFAULT_COLOURS.length));
}

function makeGameState() {
  return {
    // players
    players: [],
    currentlyPlaying: 0,

    gameOver: false,
    // resources
    lives: 3,
    info: 8,
    infoMode: 'neither',

    // cards
    deck: generateDeck(12345125),
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

const getTopOfStack = colour => getPath(['stacks', colour, 0]);
const putOnStack = R.curry((colour, number) => updatePath(['stacks', colour], R.prepend(number)));

// players functions
function makePlayer(name) {
  return {
    name: name,
    cards: [],
    knownColours: [],
    knownNumbers: []
  };
}
const addPlayer = name => update('players', R.assoc(name, makePlayer(name)));
const addCardTo = R.curry((name, card) => updatePath(['players', name, 'cards'], R.append(card)));
const removeCardFrom = R.curry((name, i) => updatePath(['players', name, 'cards'], removeAtIndex(i)));
const getCardAt = R.curry((name, card) => getPath(['players', name, 'cards', card]));

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
const getPlayers = R.compose(
  Object.keys,
  getPath(['players']));

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
function dealEachN(room, n) {
  const numPlayers = getFromRoom(room, getPlayers);
  const ps = R.flatten(R.repeat(numPlayers, n));
  R.forEach(name => updateRoom(room, dealTo(name)), ps);
}

// main move
const discard = R.curry((player, card, state) => {
  const cardObj = getCardAt(player, card)(state);

  return R.compose(
    addToDiscard(cardObj),
    removeCardFrom(player, card),
    dealTo(player),
    addInfo
  )(state);
});

// main move
const play = R.curry((player, card, state) => {
  const cardObj = getCardAt(player, card)(state);

  const topOfStack = getTopOfStack(cardObj.colour)(state);

  // if we have an empty stack
  var fn = R.identity;
  if(topOfStack === null && cardObj.number === 1
    || topOfStack === cardObj.number - 1) {
    fn = R.compose(
      putOnStack(cardObj.colour, cardObj.number),
      removeCardFrom(player, card),
      dealTo(player)
    );
  } else {
    fn = R.compose(
      addToDiscard(cardObj),
      removeCardFrom(player, card),
      dealTo(player),
      removeLife
    );
  }

  return fn(state);
});

// room state functions
function addRoom(id) {
  appState.swap(updatePath(['rooms'], R.assoc(id, { gameState: makeGameState(), roomId: id })));
}
function removeRoom(id) {
  appState.swap(updatePath(['rooms'], R.dissoc(id)));
}

// general functions
function updateRoom(id, f) {
  appState.swap(updatePath(['rooms', id, 'gameState'], f));
}
function getFromRoom(id, f) {
  return R.compose(f, getPath(['rooms', id, 'gameState']))(appState.deref());
}

addRoom('main');
updateRoom('main', addPlayer('nick'));
updateRoom('main', addPlayer('nick2'));
updateRoom('main', addPlayer('nick3'));
updateRoom('main', addPlayer('nick4'));
dealEachN('main', 5);
updateRoom('main', play('nick4', 0));
printAppState();

module.exports = {
  appState: appState,
  addRoom: addRoom, removeRoom: removeRoom,
};

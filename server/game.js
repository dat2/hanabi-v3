const R = require('ramda');
const functions = require('./functions');

// not the best named, but removes the element at index i
const removeAtIndex = R.curry((i, list) => {
  const split = R.splitAt(i, list);
  return R.concat(split[0], R.tail(split[1]));
});

// shuffle an array randomly
// takes a seed, to give some controlled randomness
// http://bost.ocks.org/mike/shuffle/
const shuffle = R.curry((seed, list) => {
  const rand = require('random-seed').create(seed);

  const clone = R.clone(list);
  var n = clone.length, t, i;
  while (n) {
    i = rand.random() * n-- | 0; // 0 ≤ i < n
    t = clone[n];
    clone[n] = clone[i];
    clone[i] = t;
  }
  return clone;
});

const jsAtom = require('js-atom');

/**
 * There are 3 1s, 2 2s, 2 3s, 2 4s, 1 5.
 */
const DEFAULT_WEIGHTS = {
  1: 3,
  2: 2,
  3: 2,
  4: 2,
  5: 1
};
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
  const nums = R.flatten(R.map(w => R.repeat(parseInt(w[0]), w[1]), R.toPairs(weights)));
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
    currentPlayer: '',

    gameOver: false,
    // resources
    lives: 3,
    info: 8,

    // cards
    deck: generateDeck(seed),
    discard: [],
    stacks: makeStacks()
  };
}

// lenses
const headLens = R.lensIndex(0);
const livesLens = R.lensProp('lives');
const infoLens = R.lensProp('info');
const gameOverLens = R.lensProp('gameOver');
const playersLens = R.lensProp('players');
const cardsLens = player => R.lensPath(['players', player, 'cards']);
const knownColoursLens = player => R.lensPath(['players', player, 'knownColours']);
const knownNumbersLens = player => R.lensPath(['players', player, 'knownNumbers']);
const currentPlayerLens = R.lensProp('currentPlayer');
const stackLens = colour => R.lensPath(['stacks', colour]);
const deckLens = R.lensProp('deck');
const discardLens = R.lensProp('discard');

// game state functions
const removeLife = R.over(livesLens, R.compose(R.max(0), R.dec));

const addInfo = R.over(infoLens, R.compose(R.min(8), R.inc));
const removeInfo = R.over(infoLens, R.dec);

const endGame = R.set(gameOverLens, true);

const getPlayers = R.compose(R.keys, R.view(playersLens));
const getFirstPlayer = R.compose(R.head, getPlayers);
const getCurrentPlayer = R.view(currentPlayerLens);

const setFirstPlayer = state => R.set(currentPlayerLens, getFirstPlayer(state), state);
const setNextPlayer = state => {
  const players = getPlayers(state);
  const player = getCurrentPlayer(state);

  const playerIndex = R.indexOf(player, players);
  const nextIndex = (playerIndex + 1) % players.length;

  return R.set(currentPlayerLens, players[nextIndex], state);
};

// stack functions
const getTopOfStack = colour => R.compose(
  R.head,
  R.view(stackLens(colour))
);
const putOnStack = R.curry((colour, number) => R.over(stackLens(colour), R.prepend(number)));
const isValidMove = R.curry((card, state) => {
  const topOfStack = getTopOfStack(card.colour)(state);
  return topOfStack === undefined && card.number === 1 || topOfStack === card.number - 1
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
const addPlayer = name => R.over(playersLens, R.assoc(name, makePlayer(name)));
const removePlayer = name => R.over(playersLens, R.dissoc(name));
const addCardTo = R.curry((name, card) => R.over(cardsLens(name), R.append(card)));
const removeCardFrom = R.curry((name, i) => R.over(cardsLens(name), removeAtIndex(i)));
const getCardAt = R.curry((name, card) => R.view(R.compose(cardsLens(name), R.lensIndex(card))));

const addKnownColour = R.curry((colour, name) =>
  R.over(
    knownColoursLens(name),
    R.compose(R.uniq, R.append(colour))
  ));
const addKnownNumber = R.curry((number, name) =>
  R.over(
    knownNumbersLens(name),
    R.compose(R.uniq, R.append(number))
  ));

// cards
const peekDeck = R.compose(
  R.head,
  R.view(deckLens)
);
const popDeck = R.over(deckLens, R.tail);

const addToDiscard = card => R.over(discardLens, R.prepend(card));
const dealTo = R.curry((name, state) =>
  R.compose(
    addCardTo(name, peekDeck(state)),
    popDeck
  )(state));

// deal to each player n cards
const dealCards = R.curry((n, state) => {
  const players = getPlayers(state);
  const ps = R.flatten(R.repeat(players, n));
  // convert each player's name to a function, that when applied to the state
  // will add the card from the top of the deck to the players cards
  // and compose each function into one large function
  return R.apply(R.compose, R.map(name => dealTo(name), ps))(state);
});

const checkGameOver = R.curry((card, state) => {
  // check if this is the last card in the discard
  const discard = R.view(discardLens, state);

  const cardToString = card => `${card.number}-${card.colour}`;

  const getWeight = card => DEFAULT_WEIGHTS[card.number];

  const cardCounts = R.countBy(cardToString, discard);
  const str = cardToString(card);
  const weight = getWeight(card);

  // if adding this card to the discard pile would put all of this card
  // eg. green-4 into the discard pile, then return true
  return (cardCounts[str] || 0) + 1 >= weight;
});

// (1) DISCARD
const discard = R.curry((card, state) => {
  const player = getCurrentPlayer(state);
  const cardObj = getCardAt(player, card)(state);

  var fn = R.identity;
  if(checkGameOver(cardObj, state)) {
    fn = endGame;
  } else {
    fn = R.compose(
      dealTo(player),
      addInfo
    );
  }

  return R.compose(
    fn,
    addToDiscard(cardObj),
    removeCardFrom(player, card),
    setNextPlayer
  )(state);
});

// (2) PLAY
const play = R.curry((card, state) => {
  const player = getCurrentPlayer(state);
  const cardObj = getCardAt(player, card)(state);

  var fn = R.identity;
  if(isValidMove(cardObj, state)) {
    fn = putOnStack(cardObj.colour, cardObj.number);
  } else {
    fn = R.compose(
      addToDiscard(cardObj),
      removeLife
    );
  }

  return R.compose(
    fn,
    removeCardFrom(player, card),
    dealTo(player),
    setNextPlayer
  )(state);
});

// (3) Give Info To
const giveInfo = R.curry((type, player, card, state) => {
  const cardObj = getCardAt(player, card)(state);

  const fn = type === 'number' ? addKnownNumber(cardObj.number) : addKnownColour(cardObj.colour);

  return R.compose(
    fn(player),
    setNextPlayer,
    removeInfo
  )(state);
});

// room state functions
function updateState(f) {
  gameState.swap(f);
}

module.exports = {
  current() {
    return gameState.deref();
  },
  reset(seed) {
    gameState.reset(makeGameState(seed));
  },
  start() {
    updateState(setFirstPlayer);
    updateState(dealCards(5));
  },
  addPlayer(name) {
    updateState(addPlayer(name));
  },
  hasPlayer(name) {
    console.log()
    return R.view(R.lensPath(['players', name]), gameState.deref()) !== undefined;
  },
  removePlayer(name) {
    updateState(removePlayer(name));
  },
  playCard(card) {
    updateState(play(card));
  },
  discardCard(card) {
    updateState(discard(card));
  },
  giveInfo(type, player, card) {
    updateState(giveInfo(type, player, card));
  }
};

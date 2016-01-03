const should = require('should');

const game = require('../game');

// DO NOT CHANGE THIS SEED
// tests all depend on this seed
beforeEach(function() {
  game.reset(123123123);
})

describe('game', function() {
  describe('#addPlayer', function() {
    it('should have a player named `nick` when you add a player named nick', function() {
      game.addPlayer('nick');
      const state = game.current();
      state.players.should.have.property('nick');
    });

    it('should have multiple players when you add multiple players', function() {
      game.addPlayer('nick');
      game.addPlayer('nick2');

      const state = game.current();
      state.players.should.have.property('nick');
      state.players.should.have.property('nick2');
    });
  });

  describe('#removePlayer', function() {
    it('should not have a player with the name that you just removed', function() {
      game.addPlayer('nick');
      game.removePlayer('nick');

      const state = game.current();
      state.players.should.be.empty();
    });

    it('should still have other players with other names', function() {
      game.addPlayer('nick');
      game.addPlayer('nick2');
      game.removePlayer('nick');

      const state = game.current();
      state.players.should.have.property('nick2');
      state.players.should.not.have.property('nick');
    });
  });

  describe('#hasPlayer', function() {
    it('should return true when there is a player with that name', function() {
      game.addPlayer('nick');
      game.hasPlayer('nick').should.be.eql(true);
    });
    it('should return false when there is not a player with that name', function() {
      game.addPlayer('nick');
      game.hasPlayer('nick2').should.be.eql(false);
    });
  });
});

describe('The game state', function() {
  describe('at the start', function() {
    it('should have the correct misc variables', function() {
      game.addPlayer('nick');
      game.addPlayer('nick2');
      game.start();

      const state = game.current();
      state.gameOver.should.be.eql(false);
      state.lives.should.be.eql(3);
      state.info.should.be.eql(8);
      state.currentPlayer.should.be.eql('nick');
    });

    it('should have a deck that has 1 five of each colour', function() {
      const state = game.current();
      state.deck.should.containEql({ number: 5, colour: 'red' });
      state.deck.should.containEql({ number: 5, colour: 'blue' });
      state.deck.should.containEql({ number: 5, colour: 'white' });
      state.deck.should.containEql({ number: 5, colour: 'green' });
      state.deck.should.containEql({ number: 5, colour: 'yellow' });
    });

    it('should have a deck that has 2 fours of each colour', function() {
      const state = game.current();

      state.deck.should.containDeep([{ number: 4, colour: 'red' },{ number: 4, colour: 'red' }]);
      state.deck.should.containDeep([{ number: 4, colour: 'blue' },{ number: 4, colour: 'blue' }]);
      state.deck.should.containDeep([{ number: 4, colour: 'white' },{ number: 4, colour: 'white' }]);
      state.deck.should.containDeep([{ number: 4, colour: 'green' },{ number: 4, colour: 'green' }]);
      state.deck.should.containDeep([{ number: 4, colour: 'yellow' },{ number: 4, colour: 'yellow' }]);
    });

    it('should have a deck that has 2 threes of each colour', function() {
      const state = game.current();

      state.deck.should.containDeep([{ number: 3, colour: 'red' },{ number: 3, colour: 'red' }]);
      state.deck.should.containDeep([{ number: 3, colour: 'blue' },{ number: 3, colour: 'blue' }]);
      state.deck.should.containDeep([{ number: 3, colour: 'white' },{ number: 3, colour: 'white' }]);
      state.deck.should.containDeep([{ number: 3, colour: 'green' },{ number: 3, colour: 'green' }]);
      state.deck.should.containDeep([{ number: 3, colour: 'yellow' },{ number: 3, colour: 'yellow' }]);
    });

    it('should have a deck that has 2 twos of each colour', function() {
      const state = game.current();

      state.deck.should.containDeep([{ number: 2, colour: 'red' },{ number: 2, colour: 'red' }]);
      state.deck.should.containDeep([{ number: 2, colour: 'blue' },{ number: 2, colour: 'blue' }]);
      state.deck.should.containDeep([{ number: 2, colour: 'white' },{ number: 2, colour: 'white' }]);
      state.deck.should.containDeep([{ number: 2, colour: 'green' },{ number: 2, colour: 'green' }]);
      state.deck.should.containDeep([{ number: 2, colour: 'yellow' },{ number: 2, colour: 'yellow' }]);
    });

    it('should have a deck that has 3 ones of each colour', function() {
      const state = game.current();

      state.deck.should.containDeep([{ number: 1, colour: 'red' },{ number: 1, colour: 'red' },{ number: 1, colour: 'red' }]);
      state.deck.should.containDeep([{ number: 1, colour: 'blue' },{ number: 1, colour: 'blue' },{ number: 1, colour: 'blue' }]);
      state.deck.should.containDeep([{ number: 1, colour: 'white' },{ number: 1, colour: 'white' },{ number: 1, colour: 'white' }]);
      state.deck.should.containDeep([{ number: 1, colour: 'green' },{ number: 1, colour: 'green' },{ number: 1, colour: 'green' }]);
      state.deck.should.containDeep([{ number: 1, colour: 'yellow' },{ number: 1, colour: 'yellow' },{ number: 1, colour: 'yellow' }]);
    });

    it('should have a deck of 50 cards', function() {
      const state = game.current();
      const nColours = 5;
      const nNumbers = 3 + 2 + 2 + 2 + 1;
      state.deck.should.have.length(nColours * nNumbers);
    });

    it('should have dealt 5 cards to each player', function() {
      game.addPlayer('nick');
      game.addPlayer('nick2');

      game.start();

      const state = game.current();

      state.players.nick.cards.should.have.length(5);
      state.players.nick2.cards.should.have.length(5);
    });
  });

  it('should update the current player correctly', function() {
    game.addPlayer('nick');
    game.addPlayer('nick2');
    game.addPlayer('nick3');
    game.addPlayer('nick4');
    game.start();

    var state = game.current();
    state.currentPlayer.should.be.eql('nick');

    game.discardCard(0); // nick discards { number: 1, colour: 'blue' }
    state = game.current();
    state.currentPlayer.should.be.eql('nick2');

    game.discardCard(0); // nick2 discards { number: 3, colour: 'blue' }
    state = game.current();
    state.currentPlayer.should.be.eql('nick3');

    game.discardCard(0); // nick3 discards { number: 1, colour: 'white' }
    state = game.current();
    state.currentPlayer.should.be.eql('nick4');

    game.discardCard(0); // nick4 discards { number: 3, colour: 'green' }
    state = game.current();
    state.currentPlayer.should.be.eql('nick');
  });
});

// CHANGE THESE TESTS IF THE SEED CHANGES
describe('playing', function() {
  it('should deal a card back to the players hand', function() {
    game.addPlayer('nick');
    game.addPlayer('nick2');
    game.start();
    const stateBefore = game.current();

    game.playCard(0);
    const stateAfter = game.current();

    stateAfter.deck.should.have.length(stateBefore.deck.length - 1);
    stateAfter.players.nick.cards.should.have.length(5);
  });

  it('should update the currently playing player', function() {
    game.addPlayer('nick');
    game.addPlayer('nick2');
    game.start();
    game.playCard(0);
    const state = game.current();

    state.currentPlayer.should.be.eql('nick2');
  });

  describe('a valid card', function() {
    // with the seed 123123123
    // nick's first card is { number: 1, colour: 'white' }
    it('should start a stack when the stack is empty', function() {
      game.addPlayer('nick');
      game.addPlayer('nick2');
      game.start();

      const before = game.current();
      before.stacks.white.should.have.length(0);

      game.playCard(0);
      const after = game.current();

      after.stacks.white.should.have.length(1);
      after.stacks.white.should.eql([1]);
    });

    // with the seed 123123123
    // nick's first card is { number: 1, colour: 'white' }
    // nick2's 5th card is { number: 2, colour: 'white' }
    it('should put on top of a stack when the stack is not empty', function() {
      game.addPlayer('nick');
      game.addPlayer('nick2');
      game.start();
      game.playCard(0); // nick plays his first card
      game.playCard(4); // nick2 plays his 5th card

      const state = game.current();
      state.stacks.white.should.have.length(2);
      state.stacks.white.should.eql([2,1]);
    });
  });

  describe('an invalid card', function() {
    it('should remove a life', function() {
      game.addPlayer('nick');
      game.addPlayer('nick2');
      game.start();
      game.playCard(2);
      const state = game.current();
      state.lives.should.be.eql(2);
    });

    it('should add the card to the discard pile', function() {
      game.addPlayer('nick');
      game.addPlayer('nick2');
      game.start();
      const stateBefore = game.current();

      game.playCard(2);
      const stateAfter = game.current();

      stateAfter.deck.should.have.length(stateBefore.deck.length - 1);
      stateAfter.discard.should.have.length(stateBefore.discard.length + 1);
    });
  });
});

describe('discarding', function() {
  it('should add the card to the discard pile', function() {
    game.addPlayer('nick');
    game.addPlayer('nick2');
    game.start();
    const stateBefore = game.current();

    game.discardCard(2);
    const stateAfter = game.current();

    stateAfter.deck.should.have.length(stateBefore.deck.length - 1);
    stateAfter.discard.should.have.length(stateBefore.discard.length + 1);
  });

  it('should update the currently playing player', function() {
    game.addPlayer('nick');
    game.addPlayer('nick2');
    game.start();
    game.discardCard(0);
    const state = game.current();

    state.currentPlayer.should.be.eql('nick2');
  });

  // with the seed 123123123
  // nick's 3rd card (game.discardCard) is { number: 4, colour: 'green' }
  describe('a valid card', function() {
    it('should deal a card back to the players hand', function() {
      game.addPlayer('nick');
      game.addPlayer('nick2');
      game.start();
      const stateBefore = game.current();

      game.discardCard(2);
      const stateAfter = game.current();

      stateAfter.deck.should.have.length(stateBefore.deck.length - 1);
      stateAfter.players.nick.cards.should.have.length(5);
    });

    it('should add an extra info token', function() {
      game.addPlayer('nick');
      game.addPlayer('nick2');
      game.start();

      // { number: 1, colour: 'green' }
      game.giveInfo('number', 'nick2', 2);

      var state = game.current();
      state.info.should.be.eql(7);

      game.discardCard(2);

      state = game.current();
      state.info.should.be.eql(8);
    });
  });

  describe('a card that ends the chance of finishing a stack', function() {
    // with the seed 123123123
    it('should set the game to be over', function() {
      game.addPlayer('nick');
      game.addPlayer('nick2');
      game.start();
      game.discardCard(0); // nick discards { number: 1, colour: 'white' }
      game.discardCard(0); // nick2 discards { number: 3, colour: 'green' }
      game.discardCard(0); // nick discards { number: 1, colour: 'blue' }
      game.discardCard(0); // nick2 discards { number: 3, colour: 'blue' }
      game.discardCard(0); // nick discards { number: 4, colour: 'green' }
      game.discardCard(4); // nick2 discards { number: 5, colour: 'green' }

      const state = game.current();
      state.gameOver.should.be.eql(true);
    });
  });
});

describe('giving info', function() {
  it('should update the current player', function() {
    game.addPlayer('nick');
    game.addPlayer('nick2');
    game.addPlayer('nick3');
    game.addPlayer('nick4');
    game.start();
    game.giveInfo('number', 'nick2', 0);

    const state = game.current();

    state.currentPlayer.should.be.eql('nick2');
  });

  it('should remove an info token', function() {
    game.addPlayer('nick');
    game.addPlayer('nick2');
    game.addPlayer('nick3');
    game.addPlayer('nick4');
    game.start();

    game.giveInfo('number', 'nick2', 0);
    var state = game.current();
    state.info.should.be.eql(7);

    game.giveInfo('number', 'nick3', 0);
    state = game.current();
    state.info.should.be.eql(6);
  });

  describe('about the number', function() {
    it('should add the selected card\'s number to the knownNumbers array', function() {

    game.addPlayer('nick');
    game.addPlayer('nick2');
    game.addPlayer('nick3');
    game.addPlayer('nick4');
    game.start();
    game.giveInfo('number', 'nick2', 0); // card is { number: 3, colour: 'blue' }

    const state = game.current();
    state.players.nick2.knownNumbers.should.have.length(1);
    state.players.nick2.knownNumbers.should.be.eql([3]);
    });
  });

  describe('about the colour', function() {
    it('should add the selected card\'s colour to the knownColours array', function() {
      game.addPlayer('nick');
      game.addPlayer('nick2');
      game.addPlayer('nick3');
      game.addPlayer('nick4');
      game.start();
      game.giveInfo('colour', 'nick2', 0); // card is { number: 3, colour: 'blue' }

      const state = game.current();
      state.players.nick2.knownColours.should.have.length(1);
      state.players.nick2.knownColours.should.be.eql(['blue']);
    });
  });
});

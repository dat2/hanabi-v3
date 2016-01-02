const should = require('should');

const game = require('../game');

beforeEach(function() {
  game.reset(123123123);
})

describe('player functions', function() {
  describe('adding players', function() {
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

  describe('removing players', function() {
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
});

describe('general state', function() {
  describe('start state', function() {
    it('should have the correct starting state', function() {
      game.addPlayer('nick');
      game.addPlayer('nick2');
      game.start();

      const state = game.current();
      state.gameOver.should.be.eql(false);
      state.lives.should.be.eql(3);
      state.info.should.be.eql(8);
      state.infoMode.should.be.eql('neither');
    });

    it('should deal 5 cards to each player', function() {
      game.addPlayer('nick');
      game.addPlayer('nick2');
      game.start();

      const state = game.current();

      state.players.nick.cards.should.have.length(5);
      state.players.nick2.cards.should.have.length(5);
    });
  });

  describe('playing a valid card', function() {
    it('should start a stack when the stack is empty', function() {
      game.addPlayer('nick');
      game.addPlayer('nick2');
      game.start();

      const state = game.current();
    });
  });


  describe('playing an invalid card', function() {

  });
});

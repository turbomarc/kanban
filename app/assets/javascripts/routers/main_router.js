Kanban.Routers.Main = Backbone.Router.extend({
  initialize: function (options) {
    this.$rootEl = options.$rootEl;
  },

  routes: {
    "": "index",
    "/login": "login",
    "boards/:id": "show",
    "boards/:id/cards/:cardId": "showCard"
  },

  index: function () {
    var that = this;

    var boardsIndex = new Kanban.Views.BoardsIndex({
      collection: Kanban.boards
    });
    
    that.$rootEl.html(boardsIndex.render().$el);
  },

  show: function (id) {
    var that = this;

    var board = Kanban.boards.get(id);
    var boardShow = new Kanban.Views.BoardShow({
      model: board
    });

    that.$rootEl.html(boardShow.render().$el);
  },
  
  showCard: function (id, cardId) {
    var that = this;

    var board = Kanban.boards.get(id);
    console.log("cardId before boardShow: " + cardId);
    var boardShow = new Kanban.Views.BoardShow({
      model: board,
      cardId: cardId
    });
    console.log("cardId after boardShow: " + cardId);
    that.$rootEl.html(boardShow.render().$el);
  }

});

Kanban.Views.ListShow = Backbone.View.extend({
	template: JST['lists/show'],
	tagName: "div",
  className: "list",
  cardToOpenId: null,

	initialize: function (attributes) {
		var that = this;
		that.cardToOpenId = parseInt(attributes.cardToOpenId);
		console.log("List initialized with cardToOpenId: " + that.cardToOpenId);
    // that.model.on("change", that.render, that);
    that.model.on("add", that.render, that);
		that.model.get("cards").on("add", that.render, that);
		that.model.get("cards").on("remove", that.render, that);
		that.model.get("cards").on("change", that.render, that);
	},

	events: {
  	"click div.card": "cardClick",
    "submit form.add_card": "addCard",
    "click button.archive_card": "archiveCard"
	},

  cardClick: function (event) {
    event.stopPropagation();
  	var that = this;

    var cardId = parseInt($(event.target).data("card-id"));
    console.log("Clicked open card: " + cardId)
    that.cardOpen(cardId);
  },
  
  cardOpen: function (cardId) {
      var that = this;
      var $cardModal = $("section.card_detail");
   	  var list = that.model;
   	  var cards = list.get("cards");
   	  var card = cards.get(cardId);
   	  console.log("Opening cardId: " + cardId);
 
      card.fetch({
        error: function(model, response) {
          console.log("FETCH ERROR: " + response.responseText);
        },
      	success: function (card) {
  		    var cardShow = new Kanban.Views.CardShow({
  		      model: card,
  		    });
  		  	$cardModal.html(cardShow.render().$el);
  		  	$cardModal.find("article.card_detail").modal();
  		  	console.log("Opened cardId: " + cardId);
      	}
      });  
  },

  addCard: function (event) {
    event.preventDefault();
  	var that = this;

    var list = that.model;
    var cards = list.get("cards");
    var card = new Kanban.Models.Card();

    // grab horizontal scroll position
    var $scrollPos = $("div.lists_wrapper").scrollLeft();

  	// get form attrs, reset form
  	var $form = $(event.target);
		var attrs = $form.serializeJSON();
		$form[0].reset();

    // add list_id to attrs
    attrs.card.list_id = list.get("id");

		// fail is no card title
    if (!attrs.card.title) {
			var listId = list.get("id");
      var $list = $("div #list_" + listId);
      var $cardInput = $("div #list_" + listId + " input.card_title");

      $cardInput.hide();
      $list.effect("shake", {
        distance: 9,
        times: 2,
        complete: function () {
          $cardInput.show();
          $cardInput.focus();
        }
      }, 350);
      $("div.lists_wrapper").scrollLeft($scrollPos);
      return false;
    }

		// save card
		card.save(attrs.card, {
		  error: function(model, response) {
        console.log("SAVE ERROR: " + response.responseText);
      },
			success: function (data) {
				var list_id = list.id;

				// add card to collection
				cards.add(card);

//				console.log("card post-save");
//				console.log(card);

				// animate card insertion
				setTimeout(function () {
					$("#card_" + card.id).removeClass("animated flipInX");
				}, 450);
				$("#card_" + card.id).addClass("animated flipInX");

				// restore scroll position, re-focus on card input
        $("div.lists").scrollLeft($scrollPos);
				$("div #list_" + list_id + " input.card_title").focus();
			}
		});
  },

  archiveCard: function (event) {
    event.stopPropagation();
  	var that = this;

		var list = that.model;
    var cardId = parseInt($(event.target).data("card-id"));
    var cards = list.get("cards");
		var card = cards.get(cardId);

		$("#card_" + card.id).addClass("animated flipOutX");
		setTimeout(function () {
			// remove card
			card.destroy({
				success: function (data) {
					cards.remove(card);
				}
			});
		}, 300);
  },

	render: function () {
		var that = this;

		var list = that.model;
		var list_id = list.get("id");
		console.log("Rendering list: " + list_id);

    // list show
		that.$el.attr("id", "list_" + list_id);
    that.$el.html(that.template({
      list: list
    }));

    // include cards index
		var cards = list.get("cards");
		var cardsIndex = new Kanban.Views.CardsIndex({
			collection: cards
		});
		that.$("section.cards").html(cardsIndex.render().el);

    // inline edit for list title
    that.$(".js-edit-list-title").editable(function (value, settings) {
      list.set({ title: value });
      list.save();
      return value;
    }, {
      submit: "Save",
      onblur: "submit",
			cssclass : "animated fadeIn"
    });

		// sortable for cards
    sortCardsUrl = "/api/cards/sort"
    var $cards = that.$("div.cards");
    $cards.sortable({
      items: "div.card",
      connectWith: ".cards",
      delay: 125,
    	tolerance: "pointer",
      placeholder: "card-placeholder",

 			start: function (e, ui) {
        ui.placeholder.width(ui.item.width());
      	ui.placeholder.height(ui.item.height());
    	},

      update: function (event, ui) {
        var sortData = $(this).sortable("serialize");

        if (sortData) {
	        // add list_id to sortData
	        var listId = parseInt($(this).data("listId"));
	        sortData += '&list_id=' + listId;

					 console.log("Updated list:" + listId);

	        $.post(sortCardsUrl, sortData, function (resortedCards) {
						var cards = list.get("cards");
						cards.reset(resortedCards.cards);

						// console.log("cards post-sort");
						// console.log(cards);
	        });
        };
      }
    });
    
	    var cardIds = _.chain(cards._byId)
                     .map(function(card, index){ return card.id; })
                     .uniq()
                     .value();
      if(_.contains(cardIds, that.cardToOpenId)){
        console.log("Direct request for card: " + that.cardToOpenId);
        that.cardOpen(that.cardToOpenId);
//          that.cardToOpenId = null;

// First card in a list always fails, but if the other cards in the list are then requested, it works (actually tries to load them all)
// probably due to not clearing something out, but that's secondary
      }
	
		return that;
	}
});

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class TailsofequestriaActorSheet extends ActorSheet {

    /** @override */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["tailsofequestria", "sheet", "actor"],
            width: 750,
            height: 600,
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "description"
            }]
        });
    }

    /** @override */
    get template() {
        const basePath = "systems/tailsofequestria/templates/actor";

        return `${basePath}/${this.actor.data.type}-sheet.html`;
    }

    /* -------------------------------------------- */

    /** @override */
    getData() {
        const data = super.getData();
        data.dtypes = ["String", "Number", "Boolean"];

        // Prepare items.
        this._prepareCharacterItems(data);

        return data;
    }

    /**
     * Organize and classify Items for Character sheets.
     *
     * @param {Object} actorData The actor to prepare.
     *
     * @return {undefined}
     */
    _prepareCharacterItems(sheetData) {
        const actorData = sheetData.actor;

        // Initialize containers.
        const gear = [];
        const quirks = [];
        const talents = [];
        const reputations = [];

        // Iterate through items, allocating to containers
        // let totalWeight = 0;
        for (let i of sheetData.items) {
            let item = i.data;
            i.img = i.img || DEFAULT_TOKEN;
            // Append to gear.
            if (i.type === 'item') {
                gear.push(i);
            }
            // Append to quirks.
            else if (i.type === 'quirk') {
                quirks.push(i);
            }
            // Append to talents.
            else if (i.type === 'talent') {
                talents.push(i);
            }
            else if (i.type === 'reputation') {
                reputations.push(i);
            }
        }

        // Assign and return
        actorData.gear = gear;
        actorData.quirks = quirks;
        actorData.talents = talents;
        actorData.reputations = reputations;
    }

    /* -------------------------------------------- */

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        // Add Inventory Item
        html.find('.item-create').click(this._onItemCreate.bind(this));

        // Update Inventory Item
        html.find('.item-edit').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.items.get(li.data("itemId"));
            item.sheet.render(true);
        });


        // Delete Inventory Item
        html.find('.item-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            this.actor.deleteEmbeddedDocuments("Item", [li.data("itemId")], {});
            li.slideUp(200, () => this.render(false));
        });

        // Rollable abilities.
        html.find('.rollable').click(this._onRoll.bind(this));

        // Drag events for macros.
        if (this.actor.owner) {
            let handler = ev => this._onDragStart(ev);
            html.find('li.item').each((i, li) => {
                if (li.classList.contains("inventory-header")) return;
                li.setAttribute("draggable", true);
                li.addEventListener("dragstart", handler, false);
            });
        }
    }

    /**
     * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
     * @param {Event} event   The originating click event
     * @private
     */
    _onItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        // Get the type of item to create.
        const type = header.dataset.type;
        // Grab any data associated with this control.
        const data = duplicate(header.dataset);
        // Initialize a default name.
        const name = `New ${type.capitalize()}`;
        // Prepare the item object.
        const itemData = {
            name: name,
            type: type,
            data: data
        };
        // Remove the type from the dataset since it's in the itemData.type prop.
        delete itemData.data['type'];

        // Finally, create the item!
        return this.actor.createEmbeddedDocuments("Item", [itemData], {renderSheet: true });
//        return this.actor.createOwnedItem(itemData, {
//            renderSheet: true
//        });
    }

    /**
     * Handle clickable rolls.
     * @param {Event} event   The originating click event
     * @private
     */
    _onRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        Dialog.confirm({
            title: "Exploding Hoof",
            content: "<p>Will it explode?</p>",
            yes: () => this._rollExplosiveDices(dataset),
            no: () => this._rollDices(dataset),
            defaultYes: false
        });
    }

    _rollDices(dataset) {
        //dataset.roll="dice,dice,...,dice;modif/dice,dice,...,dice;modif"
        let lancer = dataset.roll;
        const jet = lancer.split('/');
        const jet1 = jet[0].split(';');
        let jet2 = [];
        let jet2mod
        const jet2carac = jet[1]
        let roll = '{';
        //if the dice are modified
        if (jet1[1] !== "0") {
            let jet1mod = this._applyModifier(jet1);
            roll = roll + jet1mod.join();
        } else {
            roll = roll + jet1[0];
        }
        //get the dice for the additionnal roll
        if (jet2carac !== "") {
            jet2.push(this.actor.data.data.abilities[jet2carac].value);
            jet2.push(this.actor.data.data.abilities[jet2carac].modif);
            if (jet2[1] !== "0") {
                jet2mod = this._applyModifier(jet2);
                roll = roll + ',' + jet2mod.join();
            } else {
                roll = roll + ',' + jet2[0];
            }
        }
        roll = roll + "}kh";

        if (dataset.roll) {
            let rolling = new Roll(roll, this.actor.data.data);
            let label = dataset.label ? `Rolling ${dataset.label}` : '';
            rolling.toMessage({
                speaker: ChatMessage.getSpeaker({
                    actor: this.actor
                }),
                flavor: label
            });
        }
    }

    _applyModifier(dataset) {

        let diceArray = ['1d4', '1d6', '1d8', '1d10', '1d12', '1d20'];
        // get modifier
        let modif = parseInt(dataset[1], 10);

        //get dice array to modify
        let diceList = dataset[0].split(",");

        //get the new roll to throw
        let lastDice = diceList[diceList.length - 1];
        let lastDiceIndex = diceArray.indexOf(lastDice)
        let newDiceIndex = lastDiceIndex + modif;
        let newDice;
        if (newDiceIndex > diceArray.length - 1) {
            //if we need to add dice to the dicepool
            diceList[diceList.length - 1] = '1d20';
            newDiceIndex = newDiceIndex - 6;
            while (newDiceIndex > diceArray.length) {
                diceList.push("1d20");
                newDiceIndex = newDiceIndex - 6;
            }
            diceList.push(diceArray[newDiceIndex]);

        } else if (newDiceIndex < 0) {
            //if the dice pool is reduced by the modifier
            while (newDiceIndex < -6) {
                if (diceList.length > 1) {
                    diceList.pop();
                    newDiceIndex = newDiceIndex + 6
                }
            }
            if (diceList.length > 1) {
                diceList.pop();
                newDice = diceArray[diceArray.length + newDiceIndex];
                diceList[diceList.length - 1] = newDice;
            } else {
                diceList = ['1d4'];
            }
        } else {
            //if the number of dice in the dicepool is unmodified
            newDice = diceArray[newDiceIndex];
            diceList[diceList.length - 1] = newDice;
        }
        return diceList;


    }

    async _rollExplosiveDices(dataset) {
        //dataset.roll="dice,dice,...,dice;modif/dice,dice,...,dice;modif"
        let lancer = dataset.roll;
        const jet = lancer.split('/');
        const jet1 = jet[0].split(';');
        let jet2 = [];
        const jet2carac = jet[1]

        let jet1mod = [];
        let jet2mod = [];

        //if the dice are modified
        if (jet1[1] !== "0") {
            jet1mod = this._applyModifier(jet1);
        } else {
            jet1mod = jet1[0].split(',');
        }

        let poolExplosive = [];
        let jetExplosive = [];

        //for each dice in the array, apply the explosive dice and put the result in a new array
        let jet1modLength = jet1mod.length;
        for(let step = 0; step < jet1modLength; step++)
        {
            let pDice = this._applyExplosive(jet1mod[step]);
            let dice = await pDice;
            poolExplosive.push(...dice.dicepool)
            jetExplosive.push(...dice.result)
        }
        let roll = '{' + jetExplosive.join();
        let falseroll = '{' + poolExplosive.join();

        //get the dice for the attribute roll
        let jet2explosive = [];
        let pool2explosive = [];
        if (jet2carac !== "") {
            jet2.push(this.actor.data.data.abilities[jet2carac].value);
            jet2.push(this.actor.data.data.abilities[jet2carac].modif);


            if (jet2[0] !== "") {
                jet2mod = this._applyModifier(jet2);
                //apply add the explosive dice result to the roll
                let jet2modLength = jet2mod.length;
                for(let step = 0; step < jet2modLength; step++)
                {
                    let pDice = this._applyExplosive(jet2mod[step]);
                    let dice = await pDice;
                    pool2explosive.push(...dice.dicepool) //Dice Rolled
                    jet2explosive.push(...dice.result) //Result of roll
                }

                roll = roll + ',' + jet2explosive.join();
                falseroll = falseroll + ',' + pool2explosive.join();
            }
            jetExplosive = jetExplosive.concat(jet2explosive);
            poolExplosive = poolExplosive.concat(pool2explosive);
        }

        roll = roll + "}kh";
        falseroll = falseroll + "}kh";

        //create the true result
        let rolling = new Roll(falseroll, this.actor.data.data);

        //Determine highest value
        //Set that value as active
        let jetExplosiveLength = jetExplosive.length;
        let highest = 0;
        let hIndex = 0;
        for(let step = 0; step < jetExplosiveLength; step++)
        {
            if(step === 0 || jetExplosive[step] > highest)
            {
                highest = jetExplosive[step];
                hIndex = step;
            }
        }

        let fakeResults = [];
        //{result: 3, active: false, discarded: true}, {result:10, active: true}
        for(let step = 0; step < jetExplosiveLength; step++)
        {
           if(step === hIndex){
                fakeResults.push({result: jetExplosive[step], active: true})
           }
           else{
                fakeResults.push({result: jetExplosive[step], active: false, discarded: true})
           }
        }

        rolling.terms[0].results = fakeResults;
        rolling.terms[0]._evaluated = true;

        let oldRolls = rolling.terms[0].rolls;
        let oldRollsLength = oldRolls.length;
        for(let step = 0; step < oldRollsLength; step++)
        {
            oldRolls[step]._total = jetExplosive[step]; // Set the roll value to the dice rolls
            oldRolls[step]._evaluated = true;
            oldRolls[step].terms[0]._evaluated = true;
            oldRolls[step].terms[0].results = [{result: jetExplosive[step], active: true}];
        }

        let label = dataset.label ? `Rolling ${dataset.label}` : '';

        rolling.toMessage({
            speaker: ChatMessage.getSpeaker({
                actor: this.actor
            }),
            flavor: label
        });
    }

    async _applyExplosive(dataset) {
        let DiceRollMap = new Map([
            ['1d4', '1d6'],
            ['1d6', '1d8'],
            ['1d8', '1d10'],
            ['1d10', '1d12'],
            ['1d12', '1d20']
        ]);
        let DiceResultMap = new Map([
            ['1d4', 4],
            ['1d6', 6],
            ['1d8', 8],
            ['1d10', 10],
            ['1d12', 12],
            ['1d20', 20]
        ]);
        let roll = dataset;
        let dicepool = [];
        // let rolling = new Roll(roll, this.actor.data.data);
        let pJet = new Roll(roll, this.actor.data.data, false).roll();
        let jet = await pJet;
        let result = [];
        result.push(jet.total);
        dicepool.push(roll);

        //while dice is maximize continue to explode
        while (DiceResultMap.get(roll) === jet.total && jet.total !== 20) {
            roll = DiceRollMap.get(roll);
            pJet = new Roll(roll, this.actor.data.data, false).roll();
            jet = await pJet;
            result.push(jet.total);
            dicepool.push(roll);
        }

        return {
            dicepool: dicepool,
            result: result
        }
    }
}
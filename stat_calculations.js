`use strict`;

function computeOutputs(build) {
    // Pre-computations

    // Radiance multiplies all ids by 1.2x
    radiance(build);
    // +Consus, raid buffs, lr boons
    applyExternalBuffs(build);
    includeTomes(build);
    addArmorSpecials(build);
    addPowderBase(build);
    splitMergedIds(build);
    damagesToArrays(build);
    conversions(build);
    applyAttackSpeedToSpells(build);
    // =>
    // All damage values are multiplied by the neutral conversion % and retain their type.
    // the sum of all damage values (before the neutral scaling) is multiplied by any elemental conversions, and becomes that type.
    // =>
    // Powders convert a % of the neutral damage into their element, up to 100% of it.
    // =>
    // Masteries Node base values are added to any non-zero damage values.
    // Mastery multipliers are applied.
    // Proficiencies are applied, damage is multiplicitive
    // =>
    // TODO update applyPowderPercent() to new system:
    // applyPowderPercent(build);
    // Armor Powder Specials add to ids as standard %s
    // All elemental damages are multiplied by their coresponding % multiplier
    // =>

    // For spells/melee, the damage values are then multiplied by a value based on the weapon's **base** attack speed

    // For plain melee: (Btw the application of all raw element damage is dependent on both pre and post powder conversion) ((FIGURE OUT))
    // =>
    // Apply Skill Points, Strength, Dexterity, and any other final multipliers.

    // Radiance

    // Consumables

    // Support/General
    computeOtherOutputs(build);
    finalMerge(build);
    roundAllForDisplay(build);
    removeAllZeros(build);
}

function radiance(build) {
    if (!build.toggles.includes("radiance")) return;
    const radiance = warrior.other.radiance;
    const idNames = Object.keys(build.ids);
    for (let i = 0; i < idNames.length; i++) {
        if (radiance.excludedIds.includes(idNames[i])) continue;
        if (build.ids[idNames[i]] <= 0) continue;
        build.ids[idNames[i]] = Math.floor(build.ids[idNames[i]] * (radiance.multiplier + Number.EPSILON));
    }
}

function applyExternalBuffs(build) {
    // TODO
    // Consumables
    // LR boons
    // Raid Buffs
    // etc.
}

function includeTomes(build) {
    // TODO
}

function addArmorSpecials(build) {
    // TODO
}

function addPowderBase(build) {
    // Add powder base damage:
    for (let i = 0; i < build.powders.weapon.length; i++) {
        const powder = powders[build.powders.weapon[i]];
        addBase(build, powder.dmg, "base" + powder.element + "Damage");
    }
    // TODO: Powder elemental defence
}

// splits base damage into a min and max array
function damagesToArrays(build) {
    // base
    build.final.min = [
        build.base.baseDamage.min,
        build.base.baseEarthDamage.min,
        build.base.baseThunderDamage.min,
        build.base.baseWaterDamage.min,
        build.base.baseFireDamage.min,
        build.base.baseAirDamage.min,
    ];
    build.final.max = [
        build.base.baseDamage.max,
        build.base.baseEarthDamage.max,
        build.base.baseThunderDamage.max,
        build.base.baseWaterDamage.max,
        build.base.baseFireDamage.max,
        build.base.baseAirDamage.max,
    ];

    build.final.totalDamage = {};
    build.final.totalDamage.min =
        build.final.min[0] +
        build.final.min[1] +
        build.final.min[2] +
        build.final.min[3] +
        build.final.min[4] +
        build.final.min[5];
    build.final.totalDamage.max =
        build.final.max[0] +
        build.final.max[1] +
        build.final.max[2] +
        build.final.max[3] +
        build.final.max[4] +
        build.final.max[5];

    // raw
    build.final.rawMainAttackDamage = [
        build.final.rawNeutralMainAttackDamage,
        build.final.rawEarthMainAttackDamage,
        build.final.rawThunderMainAttackDamage,
        build.final.rawWaterMainAttackDamage,
        build.final.rawFireMainAttackDamage,
        build.final.rawAirMainAttackDamage,
    ];

    delete build.final.rawNeutralMainAttackDamage;
    delete build.final.rawEarthMainAttackDamage;
    delete build.final.rawThunderMainAttackDamage;
    delete build.final.rawWaterMainAttackDamage;
    delete build.final.rawFireMainAttackDamage;
    delete build.final.rawAirMainAttackDamage;

    build.final.rawSpellDamage = [
        build.final.rawNeutralSpellDamage,
        build.final.rawEarthSpellDamage,
        build.final.rawThunderSpellDamage,
        build.final.rawWaterSpellDamage,
        build.final.rawFireSpellDamage,
        build.final.rawAirSpellDamage,
    ];

    delete build.final.rawNeutralSpellDamage;
    delete build.final.rawEarthSpellDamage;
    delete build.final.rawThunderSpellDamage;
    delete build.final.rawWaterSpellDamage;
    delete build.final.rawFireSpellDamage;
    delete build.final.rawAirSpellDamage;

    // percent
    build.final.mainAttackDamage = [
        build.final.neutralMainAttackDamage,
        build.final.earthMainAttackDamage,
        build.final.thunderMainAttackDamage,
        build.final.waterMainAttackDamage,
        build.final.fireMainAttackDamage,
        build.final.airMainAttackDamage,
    ];

    delete build.final.neutralMainAttackDamage;
    delete build.final.earthMainAttackDamage;
    delete build.final.thunderMainAttackDamage;
    delete build.final.waterMainAttackDamage;
    delete build.final.fireMainAttackDamage;
    delete build.final.airMainAttackDamage;

    build.final.spellDamage = [
        build.final.neutralSpellDamage,
        build.final.earthSpellDamage,
        build.final.thunderSpellDamage,
        build.final.waterSpellDamage,
        build.final.fireSpellDamage,
        build.final.airSpellDamage,
    ];

    delete build.final.neutralSpellDamage;
    delete build.final.earthSpellDamage;
    delete build.final.thunderSpellDamage;
    delete build.final.waterSpellDamage;
    delete build.final.fireSpellDamage;
    delete build.final.airSpellDamage;
}

const prefixes = ["neutral", "earth", "thunder", "water", "fire", "air"];
const damageTypes = ["Neutral", "Earth", "Thunder", "Water", "Fire", "Air"];

function splitMergedIds(build) {
    const ids = build.ids;
    const final = build.final;

    // % Damages:
    prefixes.forEach((type) => {
        const typedDamage = ids.damage + ids[type + "Damage"] + (type === "neutral" ? 0 : ids.elementalDamage);

        final[type + "MainAttackDamage"] =
            ids[type + "MainAttackDamage"] +
            ids.mainAttackDamage +
            typedDamage +
            (type === "neutral" ? 0 : ids["elementalMainAttackDamage"]);
        final[type + "SpellDamage"] =
            ids[type + "SpellDamage"] +
            ids.spellDamage +
            typedDamage +
            (type === "neutral" ? 0 : ids["elementalSpellDamage"]);
    });

    // raw Damages
    damageTypes.forEach((type) => {
        const typedDamage =
            ids.rawDamage + ids["raw" + type + "Damage"] + (type === "Neutral" ? 0 : ids.rawElementalDamage);

        final["raw" + type + "MainAttackDamage"] =
            ids["raw" + type + "MainAttackDamage"] +
            ids.rawMainAttackDamage +
            typedDamage +
            (type === "Neutral" ? 0 : ids.rawElementalMainAttackDamage);
        final["raw" + type + "SpellDamage"] =
            ids["raw" + type + "SpellDamage"] +
            ids.rawSpellDamage +
            typedDamage +
            (type === "Neutral" ? 0 : ids.rawElementalSpellDamage);
    });

    // eleDef => typeDef
    prefixes
        .filter((prefix) => prefix !== "neutral")
        .forEach((prefix) => {
            ids[prefix + "Defence"] += ids.elementalDefence;
        });
}

function conversions(build) {
    createConversions(build);
    convertBase(build);
    convertRaw(build);
}

function createConversions(build) {
    switch (build.class) {
        case "shaman":
            createShamanConversions(build);
            break;
        case "archer":
            createArcherConversions(build);
            break;
        case "mage":
            createMageConversions(build);
            break;
        case "assassin":
            createAssassinConversions(build);
            break;
        case "warrior":
            createWarriorConversions(build);
            break;
    }
}

function convertBase(build) {
    Object.keys(build.convs).forEach((convName) => {
        // [a, b, c, d, e, f]

        build.baseConv[convName] = {};
        const conv = build.baseConv[convName];
        conv.min = [0, 0, 0, 0, 0, 0];
        conv.max = [0, 0, 0, 0, 0, 0];

        // elemental conversions
        for (let i = 1; i < 6; i++) {
            conv.min[i] = (build.convs[convName][i] / 100) * build.final.totalDamage.min;
            conv.max[i] = (build.convs[convName][i] / 100) * build.final.totalDamage.max;
        }
        // neutral conversion
        const neutralConversion = build.convs[convName][0] / 100;
        for (let i = 0; i < 6; i++) {
            conv.min[i] += build.final.min[i] * neutralConversion;
            conv.max[i] += build.final.max[i] * neutralConversion;
        }
    });
}

function convertRaw(build) {
    Object.keys(build.convs).forEach((convName) => {
        const conv = build.convs[convName];
        const convMult = conv[0] + conv[1] + conv[2] + conv[3] + conv[4] + conv[5];
        const baseConvMax = build.baseConv[convName].max;

        build.rawConv[convName] = [0, 0, 0, 0, 0, 0];

        for (let i = 0; i < 6; i++) {
            if (baseConvMax[i] !== 0) {
                build.rawConv[convName][i] =
                    (convMult / 100) *
                    ((convName === "Melee") | meleeAttacks.includes(convName)
                        ? build.final.rawMainAttackDamage[i]
                        : build.final.rawSpellDamage[i]);
            }
        }
    });
}

function applyAttackSpeedToSpells(build) {
    const attackSpeedMultiplier = attackSpeedMultipliers[build.attackSpeed];
    Object.keys(build.baseConv).forEach((convName) => {
        // TODO
    });
}

// TODO: deactivated since the way min and max base damages are stored was change, fix later
function applyPowderPercent(build) {
    // Convert up to 100% Neutral:
    if (build.base.baseDamage !== undefined && build.powders.weapon.length > 0) {
        var percentUsed = 0;
        for (let i = 0; i < build.powders.weapon.length; i++) {
            const powder = powders[build.powders.weapon[i]];
            const remainingPercent = 100 - percentUsed;
            const conversionPercent = 0 + remainingPercent < powder.conversion ? remainingPercent : powder.conversion;
            percentUsed += conversionPercent;
            const id = {
                min: (build.base.baseDamage.min * conversionPercent) / 100,
                max: (build.base.baseDamage.max * conversionPercent) / 100,
            };
            addBase(build, id, "base" + powder.element + "Damage");

            if (percentUsed >= 100) {
                percentUsed = 0;
                break;
            }
        }
        multiplyMinAndMaxBy(build.base.baseDamage, 1 - percentUsed / 100);
    }
}

function computeOtherOutputs(build) {
    // Apply all adders and multipliers

    // Powder defs:
    for (let i = 0; i < build.powders.armor.length; i++) {
        const powder = powders[build.powders.armor[i]];
        const powderDefs = powder.def;
        for (let j = 1; j < damageTypes.length; j++) {
            if (powderDefs[j] === 0) continue;
            addBase(build, getAsMinMax(powderDefs[j]), "base" + damageTypes[j] + "Defence");
        }
    }
}

function finalMerge(build) {
    const ids = build.ids;
    const base = build.base;
    const final = build.final;

    final.health = base.baseHealth + ids.rawHealth;
    final.healthRegen = computeUnflippableMultiplier(ids.healthRegenRaw, ids.healthRegen / 100);

    mergeElementalDefences(build);
}

function mergeElementalDefences(build) {
    for (let i = 1; i < 6; i++) {
        build.final["base" + damageTypes[i] + "Defence"] = computeUnflippableMultiplier(
            build.base["base" + damageTypes[i] + "Defence"],
            build.ids[prefixes[i] + "Defence"] / 100
        );
    }
}

function roundAllForDisplay(build) {
    const base = build.base;
    const baseNames = Object.keys(base);
    baseNames.forEach((baseName) => {
        if (!Number.isInteger(base[baseName])) return;
        base[baseName] = roundForDisplay(base[baseName]);
    });
    const ids = build.ids;
    const idNames = Object.keys(ids);
    idNames.forEach((idName) => {
        ids[idName] = roundForDisplay(ids[idName]);
    });
}

function removeAllZeros(build) {
    removeZeroIds(build);
}

function removeZeroIds(build) {
    deleteAllZerosFromObject(build.ids);
    deleteAllZerosFromObject(build.base);
    deleteAllZerosFromObject(build.final);
}

function deleteAllZerosFromObject(source) {
    const keys = Object.keys(source);
    for (let i = 0; i < keys.length; i++) {
        if (source[keys[i]] === 0) {
            delete source[keys[i]];
        }
    }
}

// undefined to zero
function udfZ(value) {
    return value === undefined ? 0 : value;
}

function getAsMax(possibleInt) {
    if (Number.isInteger(possibleInt)) return possibleInt;
    return possibleInt.max;
}

function getAsMinMax(possibleInt) {
    if (Number.isInteger(possibleInt)) {
        return {
            min: possibleInt,
            max: possibleInt,
        };
    }
    delete possibleInt.raw;

    return possibleInt;
}

function addMinAndMaxTo(target, source) {
    target.min += source.min;
    target.max += source.max;
}

function multiplyMinAndMaxBy(target, multiplier) {
    target.min *= multiplier + Number.EPSILON;
    target.max *= multiplier + Number.EPSILON;
}

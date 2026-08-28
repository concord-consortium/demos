/*
 * data.js — a Mammals-shaped sample dataset.
 *
 * Not the exact rows from the shared CODAP document, but the same attributes
 * (LifeSpan, Mass, Habitat) and the same shape of distribution, so the graph
 * reads as the same graph: a heavy cluster near the origin plus a handful of
 * high-mass outliers, split across three Habitat categories of very different
 * sizes (land is large, water and both are small).
 */
(function (global) {
  "use strict";

  var CASES = [
    { name: "African Elephant",  lifeSpan: 70, mass: 6400,  habitat: "land"  },
    { name: "Asian Elephant",    lifeSpan: 70, mass: 5000,  habitat: "land"  },
    { name: "Big Brown Bat",     lifeSpan: 19, mass: 0.02,  habitat: "land"  },
    { name: "Bottlenose Dolphin",lifeSpan: 25, mass: 635,   habitat: "water" },
    { name: "Cheetah",           lifeSpan: 14, mass: 50,    habitat: "land"  },
    { name: "Chimpanzee",        lifeSpan: 40, mass: 68,    habitat: "land"  },
    { name: "Domestic Cat",      lifeSpan: 16, mass: 4.5,   habitat: "land"  },
    { name: "Donkey",            lifeSpan: 40, mass: 187,   habitat: "land"  },
    { name: "Giraffe",           lifeSpan: 25, mass: 1100,  habitat: "land"  },
    { name: "Gray Wolf",         lifeSpan: 16, mass: 80,    habitat: "land"  },
    { name: "Grizzly Bear",      lifeSpan: 25, mass: 431,   habitat: "both"  },
    { name: "Ground Squirrel",   lifeSpan: 9,  mass: 0.1,   habitat: "land"  },
    { name: "Horse",             lifeSpan: 40, mass: 521,   habitat: "land"  },
    { name: "House Mouse",       lifeSpan: 3,  mass: 0.03,  habitat: "land"  },
    { name: "Human",             lifeSpan: 80, mass: 80,    habitat: "land"  },
    { name: "Jaguar",            lifeSpan: 20, mass: 115,   habitat: "land"  },
    { name: "Killer Whale",      lifeSpan: 50, mass: 4000,  habitat: "water" },
    { name: "Lion",              lifeSpan: 15, mass: 250,   habitat: "land"  },
    { name: "N. American Opossum", lifeSpan: 5, mass: 5,    habitat: "land"  },
    { name: "Nine-Banded Armadillo", lifeSpan: 10, mass: 6, habitat: "land"  },
    { name: "Owl Monkey",        lifeSpan: 12, mass: 1,     habitat: "land"  },
    { name: "Patas Monkey",      lifeSpan: 20, mass: 13,    habitat: "land"  },
    { name: "Pig",               lifeSpan: 10, mass: 192,   habitat: "land"  },
    { name: "Polar Bear",        lifeSpan: 20, mass: 600,   habitat: "both"  },
    { name: "Pronghorn",         lifeSpan: 10, mass: 70,    habitat: "land"  },
    { name: "Rabbit",            lifeSpan: 5,  mass: 2.5,   habitat: "land"  },
    { name: "Red Fox",           lifeSpan: 7,  mass: 5,     habitat: "land"  },
    { name: "Spotted Hyena",     lifeSpan: 25, mass: 70,    habitat: "land"  },
    { name: "Tiger",             lifeSpan: 22, mass: 220,   habitat: "land"  },
    { name: "Beaver",            lifeSpan: 24, mass: 20,    habitat: "both"  },
    { name: "Sea Otter",         lifeSpan: 23, mass: 30,    habitat: "water" },
    { name: "Harbor Seal",       lifeSpan: 35, mass: 110,   habitat: "both"  },
    { name: "Manatee",           lifeSpan: 60, mass: 480,   habitat: "water" },
    { name: "Walrus",            lifeSpan: 40, mass: 1200,  habitat: "both"  },
    { name: "Humpback Whale",    lifeSpan: 50, mass: 6500,  habitat: "water" },
    { name: "Narwhal",           lifeSpan: 50, mass: 1600,  habitat: "water" },
    { name: "Moose",             lifeSpan: 22, mass: 540,   habitat: "land"  },
    { name: "Bison",             lifeSpan: 20, mass: 900,   habitat: "land"  },
    { name: "Hippopotamus",      lifeSpan: 45, mass: 3200,  habitat: "both"  },
    { name: "Capybara",          lifeSpan: 10, mass: 55,    habitat: "both"  }
  ];

  global.CodapData = {
    name: "Mammals",
    cases: CASES.map(function (c, i) { return Object.assign({ id: "CASE" + i }, c); }),
    x: { name: "LifeSpan", units: "years", key: "lifeSpan", min: -5, max: 90, tick: 10 },
    y: { name: "Mass", units: "kg", key: "mass", min: -500, max: 7500, tick: 500 },
    legend: {
      name: "Habitat",
      key: "habitat",
      // The colors the shared CODAP document actually uses for these three
      // categories, read from the live legend keys.
      categories: [
        { name: "land",  fill: "#55ffc6" },
        { name: "water", fill: "#8255ff" },
        { name: "both",  fill: "#ff556c" }
      ]
    }
  };
})(typeof window !== "undefined" ? window : globalThis);

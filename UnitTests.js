function UnitTestInterface() {
	this.testCollection = [
		[ "Level Parser Test - JSON parsing", 											TestLevelParserJsonParsing						],
		[ "Level Parser Test - Spatial level data parsing",								TestLevelParserSpatialDataParsing				],
		[ "Level Representation - Visible region with offsets",                         TestLevelRepresentationOffsets					],
		[ "Level Representation - Single tile position",								TestLevelRepresentationTileRectPosition			]
		//[ "Test1", TestObjFormatBufferParser ],
	];

	this.constTestDescriptionIndex = 0;
	this.constTestFunctionIndex = 1;
}



UnitTestInterface.prototype.executeTests = function () {
	var failedTestCollection = [];

	for (var testLoop = 0; testLoop < this.testCollection.length; testLoop++) {
		
		var currentTestFunction = this.testCollection[testLoop][this.constTestFunctionIndex];
		if (!currentTestFunction()) {
			failedTestCollection.push(this.testCollection[testLoop][this.constTestDescriptionIndex]);
		}
	}
	
	if (failedTestCollection.length > 0) {
		var failedTestsString = "Test Failures Occurred:\n\n";
		
		for (var failedTestLoop = 0; failedTestLoop < failedTestCollection.length; failedTestLoop++) {
			failedTestsString += failedTestCollection[failedTestLoop] + "\n";			
		}
		
		alert(failedTestsString);
	}
}


function TestLevelParserJsonParsing () {
	var testSucceeded = false;
	
	var testString =
		'{ "tileSymbol": "X", "contactDamage": 0, "textureFile": "GrayTile.png" }\n'+ 
		'{ "tileSymbol": "F", "contactDamage": 10, "textureFile": "FireTile.png" }\n' +
		'@@@:::@@@\n' +
		'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\n' +
		'X\n' +
		'X\n' +
		'X\n' +
		'X                FFF\n' +
		'X             XXXXXX\n' +
		'X\n' +
		'X           XXXX\n' +
		'X\n' +
		'X      XXX\n' +
		'X\n' +
		'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\n';
		
	var textEncoder = new TextEncoder();
	var encodedTextBuffer = textEncoder.encode(testString);

	var levelParser = new SpatialLevelSpecificationParser();
	levelParser.parseSpatialLevelSpecificationBuffer(encodedTextBuffer);
	
	var numericIdsMapped = 
		levelParser.tileSymbolToNumericIdDictionary["X"] !== "undefined" &&
		levelParser.tileSymbolToNumericIdDictionary["F"] !== "undefined";
		
	var symbolAttributesX =
		levelParser.tileSymbolAttributeCollection[levelParser.tileSymbolToNumericId("X")];
	var symbolAttirubtesF =
		levelParser.tileSymbolAttributeCollection[levelParser.tileSymbolToNumericId("F")];

	var attributesStored = false;
	if ((typeof symbolAttributesX !== "undefined") && (typeof symbolAttirubtesF !== "undefined")) {
		attributesStored =
			(symbolAttributesX.contactDamage === 0) &&
			(symbolAttributesX.textureFile === "GrayTile.png") &&
			(symbolAttirubtesF.contactDamage === 10) &&
			(symbolAttirubtesF.textureFile === "FireTile.png");	
	}

	testSucceeded = numericIdsMapped && attributesStored;

	return testSucceeded;
}

function TestLevelParserSpatialDataParsing () {
	var testSucceeded = false;
	
	var testString =
		'{ "tileSymbol": "X", "contactDamage": 0, "textureFile": "GrayTile.png" }\n'+ 
		'{ "tileSymbol": "F", "contactDamage": 10, "textureFile": "FireTile.png" }\n' +
		'@@@:::@@@\n' +
		'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\n' +
		'X\n' +		
		'X\n' +
		'X                        FF\n' +
		'X                       OOO       ZZZZ\n' +
		'X\n' +
		'X\n' +
		'X\n' +
		'X\n' +
		'X\n' +		
		'X\n' +
		'X\n' +
		'X\n' +		
		'X\n' +		
		'X\n' +
		'X\n' +
		'X\n' +
		'X                FFF\n' +
		'X             XXXXXX\n' +
		'X\n' +
		'X           XXXX\n' +
		'X\n' +
		'X      XXX\n' +
		'X\n' +
		'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\n';	
	
	
	var textEncoder = new TextEncoder();
	var encodedTextBuffer = textEncoder.encode(testString);

	var levelParser = new SpatialLevelSpecificationParser();
	levelParser.parseSpatialLevelSpecificationBuffer(encodedTextBuffer);	
	
	// Four distinct symbols + space symbol
	var dictionaryIsExpectedSize = Object.keys(levelParser.tileSymbolToNumericIdDictionary).length === 5;
	
	var levelIsExpectedHeight = levelParser.levelTileRowCollection.length === 25;
	
	
	testSucceeded = dictionaryIsExpectedSize && levelIsExpectedHeight;	
	
	return testSucceeded
}

function TestLevelRepresentationOffsets() {
	var testSucceeded = false;
	
	var testString =
		'{ "tileSymbol": "X", "contactDamage": 0, "textureFile": "GrayTile.png" }\n'+ 
		'{ "tileSymbol": "F", "contactDamage": 10, "textureFile": "FireTile.png" }\n' +
		'@@@:::@@@\n' +
		'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\n' +
		'X\n' +		
		'X\n' +
		'X                        FF\n' +
		'X                       OOO       ZZZZ\n' +
		'X\n' +
		'X\n' +
		'X\n' +
		'X\n' +
		'X\n' +		
		'X\n' +
		'X\n' +
		'X\n' +		
		'X\n' +		
		'X\n' +
		'X\n' +
		'X\n' +
		'X                FFF\n' +
		'X             XXXXXX\n' +
		'X\n' +
		'X           XXXX\n' +
		'X\n' +
		'X      XXX\n' +
		'X\n' +
		'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\n';
		
	var textEncoder = new TextEncoder();
	var encodedTextBuffer = textEncoder.encode(testString);

	var levelParser = new SpatialLevelSpecificationParser();
	levelParser.parseSpatialLevelSpecificationBuffer(encodedTextBuffer);	

	var levelScaleFactorX = 0.04167;
	var levelScaleFactorY = 0.05556;
	var levelScaleFactorZ = 0.05556;
	
	var levelRepresentation = new LevelRepresentation(levelParser);
	levelRepresentation.setScaleFactors(levelScaleFactorX, levelScaleFactorY, levelScaleFactorZ);
	
	var standardOffsetVisibleRegionRect = levelRepresentation.getVisibleTileRegionTileIndexGridRect(0, 0);
	
	var standardOriginIsCorrectX = (standardOffsetVisibleRegionRect.left === 0);
	var standardOriginIsCorrectY = (standardOffsetVisibleRegionRect.top - standardOffsetVisibleRegionRect.getHeight()) === 0;
	
	var fullAreaOffsetVisibleRegionRect = levelRepresentation.getVisibleTileRegionTileIndexGridRect(-2.0, -2.0);
	var expectedOffsetVisibleRegionWidth = Math.round(levelRepresentation.constVisibleAreaWidth / levelRepresentation.levelScaleFactorX);
	var offsetVisibleWidthIsCorrect = (fullAreaOffsetVisibleRegionRect.getWidth() === expectedOffsetVisibleRegionWidth);
	
	testSucceeded = standardOriginIsCorrectX && standardOriginIsCorrectY && offsetVisibleWidthIsCorrect;
	
	return testSucceeded;
}

function TestLevelRepresentationTileRectPosition() {
	var testSucceeded = false;
	
	var testString =
		'{ "tileSymbol": "X", "contactDamage": 0, "textureFile": "GrayTile.png" }\n'+ 
		'{ "tileSymbol": "F", "contactDamage": 10, "textureFile": "FireTile.png" }\n' +
		'@@@:::@@@\n' +
		'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\n' +
		'X\n' +		
		'X\n' +
		'X                        FF\n' +
		'X                       OOO       ZZZZ\n' +
		'X\n' +
		'X\n' +
		'X\n' +
		'X\n' +
		'X\n' +		
		'X\n' +
		'X\n' +
		'X\n' +		
		'X\n' +		
		'X\n' +
		'X\n' +
		'X\n' +
		'X                FFF\n' +
		'X             XXXXXX\n' +
		'X\n' +
		'X           XXXX\n' +
		'X\n' +
		'X      XXX\n' +
		'X\n' +
		'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\n';
		
	var textEncoder = new TextEncoder();
	var encodedTextBuffer = textEncoder.encode(testString);

	var levelParser = new SpatialLevelSpecificationParser();
	levelParser.parseSpatialLevelSpecificationBuffer(encodedTextBuffer);	

	var levelScaleFactorX = 0.04167;
	var levelScaleFactorY = 0.05556;
	var levelScaleFactorZ = 0.05556;
	
	var levelRepresentation = new LevelRepresentation(levelParser);
	levelRepresentation.setScaleFactors(levelScaleFactorX, levelScaleFactorY, levelScaleFactorZ);
	
	var originTileRect = levelRepresentation.getTileRectInLevelSpace(0, 0, 0.0, 0.0);
	
	// Typically, numerical precision should be taken into account when
	// performing floating point comparisons...
	testSucceeded = (originTileRect.getCenter().getX() === 0) && (originTileRect.top - (originTileRect.getHeight() / 2.0) === 0);
	
	return testSucceeded;
}

function TestObjFormatBufferParser () {
	var testSucceeded = false;
	

	
	
	return testSucceeded;
}
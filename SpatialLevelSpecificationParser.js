// SpatialLevelSpecificationParser.js - Provides an implementation of logic required to parse
//                                      Simple Spatial Level Specification buffers


/**
 * A [Simple] Spatial Level Specification file represents
 *  a level as a two-dimensional grid of characters.
 *  Each character represents a block/tile within the
 *  level, and the tiles are located by relative
 *  positioning.
 *
 * Tiles can consist of any character, with the exception
 *  of a space (which is interpreted as void/emtpy space
 *  within a level).
 *
 * Tiles can be assigned attributes that can be intepreted
 *  within the context gameplay. These attributes are
 *  expressed at the start of the file, before the spatial
 *  level data, using a JavaScript Object Notation (JSON)
 *  format. A single string per line is expected.
 *  
 * The attribute data is separated from the tile data
 *  using the level data start sequence string - this
 *  string must be the only data on the line in order
 *  to property indicate the start of the spatial level
 *  data:
 *  @@@:::@@@
 */
function SpatialLevelSpecificationParser() {
	this.constCharacterNewLine = "\n";
	this.constCharacterCarriageReturn = "\r";
	this.constCharacterSpace = " ";
	
	this.constLevelDataStartSequenceStr = "@@@:::@@@";
	
	// Array used as a look-up table to convert parsed
	// symbols within the source data to a numeric
	// index.
	this.tileSymbolToNumericIdDictionary = {};
	
	// Collection of tile attributes, keyed by
	// the assigned numeric index.
	this.tileSymbolAttributeCollection = [];
	
	// Will contain a collection of tile rows upon successful
	// parsing. Each tile within a row is represented by a
	// numeric specifier. All tiles are assumed to have
	// equivalent dimensions.
	this.levelTileRowCollection = [];
	
	this.initializeTileSymbolToNumericIdDict();
}



/**
 * Parses a spatial level specification buffer, storing the
 *  represented level data internally
 *
 * @param buffer {ArrayBuffer}/{Uint8Array} Buffer of data that represents an ASCII/UTF-8 buffer
 */
SpatialLevelSpecificationParser.prototype.parseSpatialLevelSpecificationBuffer = function(buffer) {
	if (Utility.validateVar(buffer)) {
		
		var workingBuffer = this.arrayBufferToTextBuffer(buffer);
				
		if (workingBuffer !== null) {			
			// Divide the buffer into distinct lines in order to facilitate parsing.
			newLineDelineatedBuffer = this.buildNewLineDelineatedBuffer(workingBuffer);
			
			var foundLevelDataStartSequenceLine = false;
			var lineIndex = 0;
			
			while (!foundLevelDataStartSequenceLine && (lineIndex < newLineDelineatedBuffer.length)) {
				foundLevelDataStartSequenceLine = newLineDelineatedBuffer[lineIndex].startsWith(this.constLevelDataStartSequenceStr);
				
				if (!foundLevelDataStartSequenceLine) {
					lineIndex++;
				}
			}
			
			if ((lineIndex > 0) && (lineIndex < newLineDelineatedBuffer.length)) {
				// Attempt to parse the level data.
				var tileAttributeSectionLineBuffer = newLineDelineatedBuffer.slice(0, lineIndex);
				var levelSpecificationSectionBuffer = newLineDelineatedBuffer.slice(lineIndex + 1);

				this.parseLevelTileAttributeDataSectionBuffer(tileAttributeSectionLineBuffer);
				this.parseLevelSpecificationSectionBuffer(levelSpecificationSectionBuffer);
			}
		}
	}
}

/**
 * Constructs an array of strings, where each element within the array represents a
 *  single line 
 *
 * @param buffer {String} Buffer which is to be divided into a collection of
 *                        distinct lines
 *
 * @return {Array} A collection of string objects
 */
SpatialLevelSpecificationParser.prototype.buildNewLineDelineatedBuffer = function(buffer) {
	var newLineDelineatedBuffer = null;
	
	if (Utility.validateVar(buffer)) {
		newLineDelineatedBuffer = buffer.split(this.constCharacterNewLine);		
	}
	
	return newLineDelineatedBuffer;
}

/**
 * Parses the tile attribute specification section of the buffer
 *
 * @param lineBufferCollection {Array} Collection of strings, the start of which
 *                                     is aligned with the start of the tile attribute
 *                                     specification of the data buffer
 */
SpatialLevelSpecificationParser.prototype.parseLevelTileAttributeDataSectionBuffer = function(lineBufferCollection) {
	if (Utility.validateVar(lineBufferCollection)) {
		for (var currentLineIndex = 0; currentLineIndex < lineBufferCollection.length; currentLineIndex++) {
			var currentTileAttributeSpec = JSON.parse(lineBufferCollection[currentLineIndex]);
			if (typeof currentTileAttributeSpec.tileSymbol !== "undefined") {
				// Assign a numeric identifier to the tile symbol (the numeric
				// identifiers are assigned sequentially).
				var tileSymbolNumericId = this.tileSymbolToNumericId(currentTileAttributeSpec.tileSymbol);
				
				// Store the parsed tile attributes, keyed by the numeric index.
				delete currentTileAttributeSpec.tileSymbol;
				this.tileSymbolAttributeCollection[tileSymbolNumericId] = currentTileAttributeSpec;
			}
			else {
				// Store level-wide attributes.
				if (typeof currentTileAttributeSpec.builtInBackdrop !== "undefined") {
					this.levelBackdropSpecifier = currentTileAttributeSpec.builtInBackdrop;
				}				
			}
		}
	}	
}

 /**
 * Parses the spatial level representation section of the input
 *  data buffer
 *
 * @param lineBufferCollection {Array} Collection of strings, the start of which
 *                                     is aligned with the start of the spatial level
 *                                     section specification of the data buffer
 */
SpatialLevelSpecificationParser.prototype.parseLevelSpecificationSectionBuffer = function(lineBufferCollection) {
	if (Utility.validateVar(lineBufferCollection)) {
		// Iterate through each level row...
		for (levelParseLoop = 0; levelParseLoop < lineBufferCollection.length; levelParseLoop++) {
			var levelTileRow = this.parseLevelSpecificationSectionSingleLine(lineBufferCollection[levelParseLoop]);
			if (levelTileRow.length > 0) {
				this.levelTileRowCollection.push(levelTileRow);
			}
		}
		
		// The level specification was parsed top-to-bottom; invert the row collection such that
		// the bottom row is the first row within the collection.
		this.levelTileRowCollection.reverse();
	}
}

/**
 * Parses a single line of a level specification buffer 
 *
 * @return {Array} Collection of level tile symbols (number)
 *                 each of which corresponds to a particular
 *                 collection of tile attributes
 */
SpatialLevelSpecificationParser.prototype.parseLevelSpecificationSectionSingleLine = function (lineBuffer) {
	levelTileRow = [];
	
	if (lineBuffer.length > 0) {
		// Iterate through each symbol on each row.
		var symbolLoop = 0;
		var newLineEncountered = false;
		while ((symbolLoop < lineBuffer.length) && !newLineEncountered) {
			var currentSymbol = lineBuffer[symbolLoop];
			
			// Convert the symbol to a numeric tile identifier (will ultimately
			// be used to dynamically look-up tile attributes), and store it within
			// the internal look-up store.
			var currentSymbol = lineBuffer[symbolLoop];
			if ((currentSymbol === this.constCharacterNewLine) ||
				(currentSymbol === this.constCharacterCarriageReturn)) {

				newLineEncountered = true;
			}
			else {				
				var tileNumericId = this.tileSymbolToNumericId(currentSymbol);
				levelTileRow.push(tileNumericId);
				if (typeof this.tileSymbolAttributeCollection[tileNumericId] === "undefined") {
					this.tileSymbolAttributeCollection[tileNumericId] = {};
				}
			}
			
			symbolLoop++;
		}
	}	
	
	return levelTileRow;
}

/**
 * Retrieves assigns a numeric identifier associated with a tile
 *  character stored in the raw level specification buffer
 *
 * @return {Number} Number assigned to the tile character
 */
SpatialLevelSpecificationParser.prototype.tileSymbolToNumericId = function (tileSymbol) {
	var retrievedNumericId = 0;
	
	if (Utility.validateVar(tileSymbol)) {
		var tileSymbolNumericId = this.tileSymbolToNumericIdDictionary[tileSymbol];
		if (typeof tileSymbolNumericId !== "undefined") {
			retrievedNumericId = tileSymbolNumericId;
		}
		else {
			retrievedNumericId = Object.keys(this.tileSymbolToNumericIdDictionary).length;
			this.tileSymbolToNumericIdDictionary[tileSymbol] = retrievedNumericId;
		}
	}
	
	return retrievedNumericId;
}

/**
 * Initializes the dictionary used to convert tile symbols to
 *  numeric identifiers
 *
 * @see SpatialLevelSpecificationParser.tileSymbolToNumericId(...)
 */
SpatialLevelSpecificationParser.prototype.initializeTileSymbolToNumericIdDict = function () {
	var constEmptySpaceSymbol = " ";
	
	var emptySpaceNumericId = this.tileSymbolToNumericId(constEmptySpaceSymbol);
	this.tileSymbolAttributeCollection[emptySpaceNumericId] = this.getEmptySpaceAttributeSet();
}

/**
 * Returns the attributes used to denote that a tile represents
 *  empty space
 *
 * @return {Object} The collection of attributes used to represent
 *                  an empty space tile
 */
SpatialLevelSpecificationParser.prototype.getEmptySpaceAttributeSet = function () {	
	return { representsEmptySpace: true };
}

/**
 * Converts a "raw" binary buffer, which contains text content
 *  into a string buffer (if the buffer is already a string buffer,
 *  the provided string is returned)
 *
 * @param buffer {ArrayBuffer}/{Uint8Array} Buffer of data that represents an ASCII/UTF-8 buffer
 *
 * @return {String} String buffer containing data converted from
 *                  a binary buffer
 */
SpatialLevelSpecificationParser.prototype.arrayBufferToTextBuffer = function (buffer) {
	var outputBuffer = null;

	var workingBuffer = buffer;
	if (Utility.validateVar(buffer)) {		
		// Ensure that ArrayBuffer and Uint8Array buffers can be handled as input
		if (workingBuffer instanceof ArrayBuffer) {
			workingBuffer = new Uint8Array(workingBuffer);
		}
		
		if (workingBuffer instanceof Uint8Array) {
			// Convert the array buffer to a string buffer, as necessary.
			var textDecoder = new TextDecoder();
			workingBuffer = textDecoder.decode(buffer);
		}
		
		outputBuffer = workingBuffer;
	}
	
	return outputBuffer;
}

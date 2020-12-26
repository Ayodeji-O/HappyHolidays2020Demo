/**
 * Stores dimensions for models
 *  (render-space coordinates)
 */
function ModelDimensions() {
	this.dimensionX = 0.0;
	this.dimensionY = 0.0;
	this.dimensionZ = 0.0;
}

/**
 * Stores information pertaining to dynamic
 *  object instances that are rendered within a
 *  scene
 */
function DynamicItemInstanceData() {
	// Key used to access source model data within
	// key/value store
	this.modelDataKey = "";
	// Immediate position of the model in world
	// space
	this.modelWorldSpacePosition = new Point3d();
	// Immediate object velocity vector (meters/millisecond)
	this.velocityVector = new Vector3d(0.0, 0.0, 0.0);	
	// True if the item is considered active
	// (the active flag is interpreted
	// based on the usage context of the
	// dynamic item).
	this.isActive = true;
}

/**
 * Dynamic instance data that pertains specifically
 *  to enemy objects
 * @see DynamicItemInstanceData
 */
function EnemyInstanceData () {
	DynamicItemInstanceData.call(this);
	
	this.contactDamage = 0.0;
	this.movementPatternSpecifier = 0;
}

/**
 * Gameplay scene object which contains data that is employed
 *  to maintain the game state, in addition to retaining data
 *  that is immediately required for rendering the game
 *  scene
 */
function MainLittleHelpersGameplayScene() {
	this.constScaleFactorDefaultLegoProtagonist = 0.20;
	
	this.constModelInitializationScaleFactors = {};	
	this.constModelInitializationScaleFactors[globalResources.keyModelLegoProtagonistHead] = this.constScaleFactorDefaultLegoProtagonist * 0.617;
	this.constModelInitializationScaleFactors[globalResources.keyModelLegoProtagonistHips] = this.constScaleFactorDefaultLegoProtagonist * 0.759;
	this.constModelInitializationScaleFactors[globalResources.keyModelLegoProtagonistTorso] = this.constScaleFactorDefaultLegoProtagonist;
	this.constModelInitializationScaleFactors[globalResources.keyModelLegoProtagonistLeftArm] = this.constScaleFactorDefaultLegoProtagonist * 0.807;
	this.constModelInitializationScaleFactors[globalResources.keyModelLegoProtagonistRightArm] = this.constScaleFactorDefaultLegoProtagonist * 0.807;
	this.constModelInitializationScaleFactors[globalResources.keyModelLegoProtagonistLeftLeg] = this.constScaleFactorDefaultLegoProtagonist * 0.750;
	this.constModelInitializationScaleFactors[globalResources.keyModelLegoProtagonistRightLeg] = this.constScaleFactorDefaultLegoProtagonist * 0.759;
	this.constModelInitializationScaleFactors[globalResources.keyModelEnemyGrinch] = 0.18;
	this.constModelInitializationScaleFactors[globalResources.keyModelEnemyCoronaVirusMonster] = 0.18;
	
	// Coefficients used during construction of the composite lego
	// protagonist model (relative displacement, etc.)
	this.modelLegoProtagonistConstrCoeff = {};
	this.modelLegoProtagonistConstrCoeff.constHipDisplacementCoeffY = -0.23;
	this.modelLegoProtagonistConstrCoeff.constLegPivotRefDisplacementCoeffY = -0.25;
	this.modelLegoProtagonistConstrCoeff.constLegOriginHipRelativeDisplacementCoeffY = -0.20;
}


/**
 * Initializes the scene - invoked before scene execution
 *  
 * @param completionFunction {Function} Function to be invoked upon completion
 *                                      of the initialization process
 *
 * @see sceneExecution()
 */
MainLittleHelpersGameplayScene.prototype.initialize = function (completionFunction) {
	this.totalElapsedSceneTimeMs = 0.0;
	
	// Number of floating point values that comprise a vertex
	this.constVertexSize = 3;
	// Number of floating point values that comprise a vector
	this.constVectorSize = 3;
	// Number of floating point values that comprise a vertex
	// color
	this.constVertexColorSize = 4;
	// Number of floating point values that comprise a texture
	// coordinate
	this.constTextureCoordinateSize = 2;	
	
	// Value used to represent approximate numeric equality.
	this.constNumberEpsilon = Number.EPSILON * 100.0;
	
	// Scaling factor used to appropriately adjust the world scale to the
	// WebGL coordinate system. Each unit measurement value is roughly
	// equivalent to 1 meter; the world scale does not change the actual
	// equivalent unit length - it only adjusts the scale used for
	// rendering.
	// 1 meter = x rendering coordinate space units
	this.constWorldScale = 0.156;
	
	// Gravitational acceleration, expressed in meters / millisecond²
	this.constGravitationalAccelerationMetersPerMsSq = 9.8 /
		(Constants.millisecondsPerSecond * Constants.millisecondsPerSecond);
	
	// 3D-transformation matrix size - 4 x 4
	this.constTransformationMatrixRowCount = 4;
	this.constTransformationMatrixColumnCount = 4;

	// Goal status overlay
	this.goalStatusOverlayTopY = 0.85;
	this.goalStatusOverlayHeight = 0.10;
	
	// Spirit gauge overlay position
	this.gaugeOverlayTopY = 0.95;
	this.gaugeOverlayHeight = 0.10;
	
	// Backdrop geometry
	this.backdropVertices = new Float32Array([
		// Upper-left (triangle #1)
		-1.0, 	1.0,	1.0,
		// Lower-left (triangle #1)
		-1.0, 	-1.0,	1.0,
		// Lower-right (triangle #1)
		1.0, 	-1.0,	1.0,
		
		// Lower-right (triangle #2)
		1.0, 	-1.0,	1.0,
		// Upper-right (triangle #2)		
		1.0, 	1.0, 	1.0,
		// Upper-left (triangle #2)
		-1.0, 	1.0, 	1.0,
	]);
	
	// Full-screen display overlay geometry
	this.fullScreenOverlayVertices = new Float32Array([
		// Upper-left (triangle #1)
		-1.0, 	1.0,	-1.0,
		// Lower-left (triangle #1)
		-1.0, 	-1.0,	-1.0,
		// Lower-right (triangle #1)
		1.0, 	-1.0,	-1.0,
		
		// Lower-right (triangle #2)
		1.0, 	-1.0,	-1.0,
		// Upper-right (triangle #2)		
		1.0, 	1.0, 	-1.0,
		// Upper-left (triangle #2)
		-1.0, 	1.0, 	-1.0,
	]);
	
	// Overlay geometry (used during WebGL vertex
	// data generation)	
	this.goalStatusOverlayVertices = new Float32Array([
		// Upper-left (triangle #1)
		-1.0, 	this.goalStatusOverlayTopY, 								-1.0,
		// Lower-left (triangle #1)
		-1.0, 	this.goalStatusOverlayTopY - this.goalStatusOverlayHeight,	-1.0,
		// Lower-right (triangle #1)
		1.0, 	this.goalStatusOverlayTopY - this.goalStatusOverlayHeight,	-1.0,
		
		// Lower-right (triangle #2)
		1.0, 	this.goalStatusOverlayTopY - this.goalStatusOverlayHeight,	-1.0,
		// Upper-right (triangle #2)		
		1.0, 	this.goalStatusOverlayTopY, 								-1.0,
		// Upper-left (triangle #2)
		-1.0, 	this.goalStatusOverlayTopY, 								-1.0,
	]);
	
	// Spirit gauge overlay geometry (used during WebGL vertex
	// data generation)	
	this.gaugeOverlayVertices = new Float32Array([
		// Upper-left (triangle #1)
		-1.0, 	this.gaugeOverlayTopY, 								-1.0,
		// Lower-left (triangle #1)
		-1.0, 	this.gaugeOverlayTopY - this.gaugeOverlayHeight,	-1.0,
		// Lower-right (triangle #1)
		1.0, 	this.gaugeOverlayTopY - this.gaugeOverlayHeight,	-1.0,
		
		// Lower-right (triangle #2)
		1.0, 	this.gaugeOverlayTopY - this.gaugeOverlayHeight,	-1.0,
		// Upper-right (triangle #2)		
		1.0, 	this.gaugeOverlayTopY, 								-1.0,
		// Upper-left (triangle #2)
		-1.0, 	this.gaugeOverlayTopY, 								-1.0,
	]);

	// Overlay texture coordinates (used during WebGL vertex
	// data generation)	
	this.progressOverlayDimensions = 0.5;
	// Overlay geometry (used during WebGL vertex
	// data generation)	
	this.progressOverlayVertices = new Float32Array([
		// Upper-left (triangle #1)
		-this.progressOverlayDimensions,	this.progressOverlayDimensions,		-1.0,
		// Lower-left (triangle #1)
		-this.progressOverlayDimensions,	-this.progressOverlayDimensions,	-1.0,
		// Lower-right (triangle #1)
		this.progressOverlayDimensions,		-this.progressOverlayDimensions,	-1.0,
		
		// Lower-right (triangle #2)
		this.progressOverlayDimensions,		-this.progressOverlayDimensions,	-1.0,
		// Upper-right (triangle #2)		
		this.progressOverlayDimensions,		this.progressOverlayDimensions,		-1.0,
		// Upper-left (triangle #2)
		-this.progressOverlayDimensions,	this.progressOverlayDimensions,		-1.0,
	]);

	// Overlay texture coordinates (used during WebGL vertex
	// data generation)	
	this.overlayTextureCoords = new Float32Array([
		// Upper-left (triangle #1)
		0.0, 0.0,
		// Lower-left (triangle #1)
		0.0, 1.0,
		// Lower-right (triangle #1)		
		1.0, 1.0,
		
		// Lower-right (triangle #2)	
		1.0, 1.0,
		// Upper-right (triangle #2)
		1.0, 0.0,
		// Upper-left (triangle #2)
		0.0, 0.0
	]);
	
	// Backdrop texture coordinates (used during WebGL vertex
	// data generation)	
	this.backdropTextureCoords = new Float32Array([
		// Upper-left (triangle #1)
		0.5, 0.5,
		// Lower-left (triangle #1)
		0.5, 1.5,
		// Lower-right (triangle #1)		
		1.5, 1.5,
		
		// Lower-right (triangle #2)	
		1.5, 1.5,
		// Upper-right (triangle #2)
		1.5, 0.5,
		// Upper-left (triangle #2)
		0.5, 0.5
	]);		
	
	
	this.progressOverlayWebGlData = null;
	this.backdropRenderWebGlData = null;
	this.goalStatusOverlayRenderWebGlData = null;
	this.gaugeOverlayRenderWebGlData = null;
	this.fullScreenOverlayWebGlData = null;
	this.webGlBufferDataLeveTileCube = null;
	
	// Vector indicating the direction of the
	// ambient light source
	this.constAmbientLightVector = new Float32Array([
		-0.4, -0.3, -0.4
	]);
	
	
	// Spirit Gauge colors
	this.constSpiritGaugeMaxValueColor = new RgbColor(0.0, 1.0, 0.0, 0.75);
	this.constSpiritGaugeMinValueColor = new RgbColor(0.8, 0.0, 0.0, 0.75);
	this.constSpiritGaugeLeadingEdgeColor = new RgbColor(1.0, 1.0, 1.0, 1.0);
	this.constSpiritGaugeLeadingEdgeFraction = 0.92
	this.constSpiritGaugeOutlineColor = new RgbColor(1.0, 1.0, 1.0, 0.9);	
	
	this.constSpiritGaugeWidth = 650;
	
	this.constTileWidthWorldUnits = 0.60;
	this.constTileHeightWorldUnits = 0.90;
	this.constTileDepthWorldUnits = 0.90;
	
	// Level scale factors - converts 4:3 aspect ratio to
	// 1:1
	this.levelScaleFactorX = (this.constWorldScale * this.constTileWidthWorldUnits);//0.04167;
	this.levelScaleFactorY = (this.constWorldScale * this.constTileHeightWorldUnits);//0.05556;
	this.levelScaleFactorZ = (this.constWorldScale * this.constTileDepthWorldUnits);//0.05556;
	
	// Divisor which determines how slowly the backdrop
	// scrolls in relation to the foreground.
	this.constBackdropScrollRateDivisor = 4.0;
	
	// Key used to look-up the backdrop texture from the resources
	// key-value store.
	this.currentBackdropTextureKey = null;
	
	// Index of the current level
	// @see MainLittleHelpersGameplayScene.levelKeyCollection
	this.currentLevelIndex = 0;
	
	// Default worldspace staring position for the lego protagonist
	this.constLegoProtagonistStartingWorldSpacePosition = new Point3d(1.0, 8.0, 0.0);
	
	// Render-space position in level
	this.currentPositionInLevel = new Point3d(0.0, 0.0, 0.0);

	this.shaderStandardTexturedObject = null;
	this.shaderBackdropRender = null;
	this.shaderBlackFader = null;
	this.shaderStandardOverlayTextureRender = null;
	
	// Lego protagonist world space position, expressed
	// in meters
	this.currentLegoProtagonistWorldSpacePosition = this.constLegoProtagonistStartingWorldSpacePosition;
	
	// Lego protagonist velocity, expressed in meters/millisecond
	this.currentLegoProtagonistVelocity = new Vector3d(0.0, 0.0, 0.0);
	
	// Lego protagonist ambulation acceleration, expressed in meters / millisecond²
	this.legoProtagonistAmbulationAccelerationMetersPerMsSq = 30.0 /
		(Constants.millisecondsPerSecond * Constants.millisecondsPerSecond);
		
	// Lego protagonist aerial acceleration adjustment factor (relative
	// to ambulation acceleration)
	this.legoProtagonistAerialAccelerationScaleFactor = 0.15;
		
	// Lego protagonist ambulation deceleration, (used when stopping),
	// expressed in meters / millisecond²
	this.legoProtagonistAmbulationDecelerationMetersPerMsSq =
		this.legoProtagonistAmbulationAccelerationMetersPerMsSq;
		
	// Acceleration along the X-axis that is being explicitly applied to
	// the lego protagonist.
	this.currentLegoProtagonistAmbulationAccelerationAxisX = 0.0;
	
	// Lego protagonist maximum ambulation velocity (12 miles / hour)
	this.currentLegoProtagonistMaxAmbulationVelocityX = 5.36448 /
		Constants.millisecondsPerSecond;

	// Initial vertical velocity applied to the lego protagonist
	// during a jump.
	this.initialLegoProtagonistJumpVelocityMetersPerMs = 5.50 /
		Constants.millisecondsPerSecond;
	
	// Flag which indicates that a jump was initiated (evaluated
	// only once per flag activation).
	this.legoProtagonistJumpInitiated = false;
	
	// Rotation rate of the goal item (animation) - degrees /
	// millisecond
	this.goalItemRotationRate = (Math.PI / 2.0) / Constants.millisecondsPerSecond;
	
	// "Reference" model dimensions for loaded models - represents
	// the dimensions of models before they were loaded (before
	// any applied transformations) (ModelDimensions collection)
	this.modelRefDimensionKeyValStore = {};
	
	// Matrices which govern the position/orientation of the
	// lego protagonist model, with the torso centered at
	// the origin (MathExt.Matrix collection)
	this.modelMatrixKeyValStore = {};
	
	// Displacement added to certain models under particular
	// circumstances (Vector3d collection, render-space
	// coordinates).
	this.modelAdditionalDisplacementKeyValStore = {};
	
	// (~13 meters/second / 30 miles / hour)
	this.baseAdditionalDisplacementPerMs = (this.constWorldScale * 13.41) / Constants.millisecondsPerSecond;
	this.constLegoProtagonistModelBaseAdditionalDisplacements = {};
	this.constLegoProtagonistModelBaseAdditionalDisplacements[globalResources.keyModelLegoProtagonistHead] =
		new Vector3d(0.0, this.baseAdditionalDisplacementPerMs, 0.0);
	this.constLegoProtagonistModelBaseAdditionalDisplacements[globalResources.keyModelLegoProtagonistHips] =
		new Vector3d(0.8 * this.baseAdditionalDisplacementPerMs, 0.6 * this.baseAdditionalDisplacementPerMs, 0.0);
	this.constLegoProtagonistModelBaseAdditionalDisplacements[globalResources.keyModelLegoProtagonistTorso] =
		new Vector3d(-0.8 * this.baseAdditionalDisplacementPerMs, 0.6 * this.baseAdditionalDisplacementPerMs, 0.0);
	this.constLegoProtagonistModelBaseAdditionalDisplacements[globalResources.keyModelLegoProtagonistLeftArm] =
		new Vector3d(0.9 * this.baseAdditionalDisplacementPerMs, 0.31 * this.baseAdditionalDisplacementPerMs, 0.0);
	this.constLegoProtagonistModelBaseAdditionalDisplacements[globalResources.keyModelLegoProtagonistRightArm] =
		new Vector3d(-0.9 * this.baseAdditionalDisplacementPerMs, 0.31 * this.baseAdditionalDisplacementPerMs, 0.0);
	this.constLegoProtagonistModelBaseAdditionalDisplacements[globalResources.keyModelLegoProtagonistLeftLeg] =
		new Vector3d(0.0, 0.0, 0.0);
	this.constLegoProtagonistModelBaseAdditionalDisplacements[globalResources.keyModelLegoProtagonistRightLeg] =
		new Vector3d(0.0, 0.0, 0.0);
		
	
	// Lego protagonist WebGL buffers (WebGL vertex buffer data) -
	// each component of the lego protagonist will be represented
	// with a separate buffer
	this.webGlBufferDataKeyValStore = {};
	
	// Animation types for lego protagonist
	this.constLegoProtagonistAnimationTypeStationary = 0;
	this.constLegoProtagonistAnimationTypeAmbulation = 1;
	this.constLegoProtagonistAnimationTypeJump = 2
	this.constLegoProtagonistAnimationTypeDamageReception = 3;
	
	// Type of the current lego protagonist animation sequence
	this.currentLegoProtagonistAnimationType = this.constLegoProtagonistAnimationTypeStationary;
	// Starting time of the current animation sequence
	this.currentLegoProtagonistAnimationStartTimeMs = 0;	
	// Time at which gameplay activity stopped (e.g. game over state)
	this.gameActivityEndTimeMs = 0;
	
	this.constLegoProtagonistInvulnerabilityFrameInterval = 2;
	this.currentLegoProtagonistFrameRenderInterval = 0;
	
	this.currentLegoProtagonistRenderIntervalFrameCount = 0;
	
	// Model direction bias to apply to the model when no acceleration
	// is being applied along the X-axis.
	this.currentLegoProtagonistStaticModelDirectionBias = 1;

	// Duration for which the lego protagonist is temporarily
	// invulnerable (after being damaged by an enemy, etc.)
	this.constLegoProtagonistInvulnerabilityDurationMs = 3000;

	// Immediate invulnerability duration
	this.currentLegoProtagonistInvulnerabilityStartTimeMs = 0;
	
	// Interval, in milliseconds, at which overlay textures will
	// be updated (updates may involve updating textures, which
	// can be a relatively slow process).
	this.constOverlayUpdateIntervalMs = 400;
	
	// Ensure that an initial update is performed.
	this.currentOverlayUpdateElapsedInterval = this.constOverlayUpdateIntervalMs;
	
	// Rate at which the lego protagonist health decreases per millisecond
	this.constLegoProtagonistHealthDecreaseRatePerMs = 0.20 / Constants.millisecondsPerSecond;

	// Minimum / maximum values of health gauge	
	this.constLegoProtagonistMinHealth = 0;
	this.constLegoProtagonistMaxHealth = 50;
	
	this.legoProtagonistCurrentHealth = this.constLegoProtagonistMaxHealth;

	// Number of discovered goal items
	// @see MainLittleHelpersGameplayScene.goalItemInstanceDataCollection
	this.discoveredGoalItemCount = 0;

	// Collection of goal items to be located within
	// the active level (DynamicItemInstanceData type)
	this.goalItemInstanceDataCollection = [];
	
	// Collection of enemy objects which exist
	// within the active level (EnemyInstanceData type)
	this.enemyInstanceDataCollection = [];
	
	this.constOperationStateActive = 0;
	this.constOperationStateInterLevelPause = 1;
	this.constOperationStateInactive = 2;
	
	this.constFadeDurationMs = 1500;
	this.fadeTransitionStartTimeMs = 0;
	
	this.constFadeTransitionStatusNone = 0;
	this.constFadeTransitionStatusFadingToBlack = 1;
	this.constFadeTransitionStatusFadingToBlackDone = 2;
	this.constFadeTransitionStatusFadingFromBlack = 3;
	this.constFadeTransitionStatusFadingFromBlackDone = 4;
	
	this.fadeTransitionStatus = this.constFadeTransitionStatusNone;
	
	this.constInterLevelPauseDurationMs = 500;	
	this.interLevelPauseStartTimeMs = 0;
	
	this.pendingOperationState = this.constOperationStateActive;
	this.operationState = this.constOperationStateActive;
	
	// Will be true when the "Game Over" screen content has
	// been rendered
	this.gameEndOverlayContentHasBeenGenerated = false;
	
	this.gameCompletionOverlayContentHasBeenGenerated = false;
	
	this.fadeOverlayContentHasBeenGenerated = false;
	
	// Cube WebGL buffers (WebGL vertex buffer data) which will
	// be rendered to represent a single level tile
	this.webGlBufferDataLeveTileCube = null;
	
	// Represents the spatial data / element attribute specification
	// of the current level.
	this.currentLevelRepresentation = null;
	
	// Keys used to reference level data within the
	// resource key/value store
	this.levelKeyCollection =
	[
		globalResources.keyLevel1,		
		globalResources.keyLevel2,
		globalResources.keyLevel3,
		globalResources.keyLevel4,
		globalResources.keyLevel5,
		globalResources.keyLevel6,
		globalResources.keyLevel7,
		globalResources.keyLevel8,
		globalResources.keyLevel9,
		globalResources.keyLevel10
	];
	
	// Dictionary that matches level specification
	// model symbols to pre-loaded/built-in model
	// resource keys.
	this.levelBuiltInModelSymbolToModelKeyDict = {};
	this.levelBuiltInModelSymbolToModelKeyDict["BuiltInModel_LegoHead"] = globalResources.keyModelLegoProtagonistHead;
	this.levelBuiltInModelSymbolToModelKeyDict["BuiltInModel_LegoHips"] = globalResources.keyModelLegoProtagonistHips;
	this.levelBuiltInModelSymbolToModelKeyDict["BuiltInModel_LegoTorso"] = globalResources.keyModelLegoProtagonistTorso;
	this.levelBuiltInModelSymbolToModelKeyDict["BuiltInModel_LegoLeftArm"] = globalResources.keyModelLegoProtagonistLeftArm;
	this.levelBuiltInModelSymbolToModelKeyDict["BuiltInModel_LegoRightArm"] = globalResources.keyModelLegoProtagonistRightArm;
	this.levelBuiltInModelSymbolToModelKeyDict["BuiltInModel_LegoLeftLeg"] = globalResources.keyModelLegoProtagonistLeftLeg;
	this.levelBuiltInModelSymbolToModelKeyDict["BuiltInModel_LegoRightLeg"] = globalResources.keyModelLegoProtagonistRightLeg;
	this.levelBuiltInModelSymbolToModelKeyDict["BuiltInModel_EnemyGrinch"] = globalResources.keyModelEnemyGrinch;
	this.levelBuiltInModelSymbolToModelKeyDict["BuiltInModel_EnemyCoronaVirus"] = globalResources.keyModelEnemyCoronaVirusMonster;
	
	this.levelBuiltInTextureToTextureKeyDict = {};
	this.levelBuiltInTextureToTextureKeyDict["BuiltInTexture_BrownCoarseStone"] = globalResources.keyTextureBrownCoarseStone;
	this.levelBuiltInTextureToTextureKeyDict["BuiltInTexture_Lava"] = globalResources.keyTextureLava;
	this.levelBuiltInTextureToTextureKeyDict["BuiltInTexture_GreenMutedScale"] = globalResources.keyTextureGreenMutedScale;
	this.levelBuiltInTextureToTextureKeyDict["BuiltInTexture_TreeBark"] = globalResources.keyTextureTreeBark;
	this.levelBuiltInTextureToTextureKeyDict["BuiltInTexture_BeigeMarble"] = globalResources.keyTextureBeigeMarble;
	this.levelBuiltInTextureToTextureKeyDict["BuiltInTexture_IceBlock"] = globalResources.keyTextureIceBlock;
	this.levelBuiltInTextureToTextureKeyDict["BuiltInTexture_SnowCappedStone"] = globalResources.keyTextureSnowCappedStone;
	this.levelBuiltInTextureToTextureKeyDict["BuiltInTexture_BeigeBlotchedSmoky"] = globalResources.keyTextureBeigeBlotchedSmoky;
	this.levelBuiltInTextureToTextureKeyDict["BuiltInTexture_SnowCappedSoil"] = globalResources.keyTextureSnowCappedSoil;
	this.levelBuiltInTextureToTextureKeyDict["BuiltInTexture_LeftEdgeSoilWall"] = globalResources.keyTextureLeftEdgeSoilWall;
	this.levelBuiltInTextureToTextureKeyDict["BuiltInTexture_RightEdgeSoilWall"] = globalResources.keyTextureRightEdgeSoilWall;
	this.levelBuiltInTextureToTextureKeyDict["BuiltInTexture_BrownWavySmoky"] = globalResources.keyTextureBrownWavySmoky;
	this.levelBuiltInTextureToTextureKeyDict["BuiltInTexture_GreyCobbledStoneWall"] = globalResources.keyTextureGreyCobbledStoneWall;
	this.levelBuiltInTextureToTextureKeyDict["BuiltInTexture_GreyCobbledRoundedStoneWall"] = globalResources.keyTextureGreyCobbledRoundedStoneWall;
	this.levelBuiltInTextureToTextureKeyDict["BuiltInTexture_GoldShinyBrushed"] = globalResources.keyTextureGoldShinyBrushed;
	this.levelBuiltInTextureToTextureKeyDict["BuiltInTexture_StackedMetalPlate"] = globalResources.keyTextureStackedMetalPlate;
	this.levelBuiltInTextureToTextureKeyDict["BuiltInTexture_MetalBrushed"] = globalResources.keyTextureMetalBrushed;
	this.levelBuiltInTextureToTextureKeyDict["BuiltInTexture_MetalDiamondPlate"] = globalResources.keyTextureMetalDiamondPlate;
	this.levelBuiltInTextureToTextureKeyDict["BuiltInTexture_DarkGreyVolcanicRock"] = globalResources.keyTextureDarkGreyVolcanicRock;
	this.levelBuiltInTextureToTextureKeyDict["BuiltInTexture_GroutedStoneBackdrop"] = globalResources.keyTextureGroutedStoneBackdrop;
	this.levelBuiltInTextureToTextureKeyDict["BuiltInTexture_GreyIrregularBrickBackdrop"] = globalResources.keyTextureGreyIrregularBrickBackdrop;
	this.levelBuiltInTextureToTextureKeyDict["BuiltInTexture_TaupeRoughSlateBackdrop"] = globalResources.keyTextureTaupeRoughSlateBackdrop;
	this.levelBuiltInTextureToTextureKeyDict["BuiltInTexture_ChiseledIceBackdrop"] = globalResources.keyTextureChiseledIceGeneticaBackdrop;
	this.levelBuiltInTextureToTextureKeyDict["BuiltInTexture_LavaBackdrop"] = globalResources.keyTextureLavaBackdrop;
	this.levelBuiltInTextureToTextureKeyDict["BuiltInTexture_GreySciFiPanelBackdrop"] = globalResources.keyTextureGreySciFiPanelBackdrop
	this.levelBuiltInTextureToTextureKeyDict["BuiltInTexture_RustyMetalPanelBackdrop"] = globalResources.keyTextureRustyMetalPanelBackdrop


	this.constLevelSymbolContactDamageSpecifier = "contactDamage";
	this.constLevelSymbolTypeGoalSpecifier = "ElementType_Goal";
	this.constLevelSymbolTypeEnemySpecifier = "ElementType_Enemy";	
	
	
	// Internal scale factor applied to device acceleration values acquired for protagonist movement
	this.constDeviceAttitudeAccelScaleFactor = 3.0;
	// Exponent for power function applied to acquired unit input values for protagonist movement
	// (reduces sensitivity for low-magnitude inputs).
	this.constDeviceAccelResultExpoFactor = 1.5;
	// Input event receivers - keyboard, device orientation and device touch.	
	this.keyboardInputEventReceiver = new KeyboardInputEventReceiver(window);
	this.deviceAttitudeInputEventReceiver = new DeviceAttitudeInputEventReceiver(window);
	this.deviceAttitudeInputEventReceiver.setScaleFactor(this.constDeviceAttitudeAccelScaleFactor);
	this.deviceTouchInputEventReceiver = new DeviceTouchInputEventReceiver(window);

	// Left margin of the gauge overlay text
	this.constOverlayTextLeftMargin = 15;
	// Left margin of the goal status overlay text
	this.constOverlayGoalStatusLeftMargin = 15;

	// Abstractly manages input device binding.
	this.inputEventInterpreter = new InputEventInterpreter();
	
	// Background color for the text section.
	this.defaultTextAreaBackgroundColor =  new RgbColor(
		Constants.defaultTextBackgroundUnitIntensity,
		Constants.defaultTextBackgroundUnitIntensity,
		Constants.defaultTextBackgroundUnitIntensity,		
		Constants.defaultTextBackgroundUnitAlpha);
		
	// Background color for the "game over" overlay
	this.gameEndOverlayBackgroundColor = new RgbColor(0.0, 0.0, 0.0, 0.8);
		
	// Color used to clear the WebGL canvas
	this.constCanvasClearColor = new RgbColor(0.0, 0.0, 0.0, 0.0);
	
	// Canvas used to render the goal status label
	this.goalStatusTextCanvasBuffer = new StaticTextLineCanvasBuffer(Constants.labelFontSizePx,
		Constants.labelFont, Constants.labelFontStyle);
	
	// Canvas used to render the spirit gauge / spirit label
	this.spiritLabelCanvasBuffer = new StaticTextLineCanvasBuffer(Constants.labelFontSizePx,
		Constants.labelFont, Constants.labelFontStyle);
	this.spiritLabelCanvasBuffer.updateStaticTextString(Constants.stringVitalityLabel);
	
	var webGlCanvasContext = globalResources.getMainCanvasContext();
	webGlCanvasContext.clearColor(this.constCanvasClearColor.getRedValue(), this.constCanvasClearColor.getGreenValue(),
		this.constCanvasClearColor.getBlueValue(), this.constCanvasClearColor.getAlphaValue())	

	// Enable alpha blending.
	webGlCanvasContext.enable(webGlCanvasContext.BLEND);
	webGlCanvasContext.blendFunc(webGlCanvasContext.SRC_ALPHA, webGlCanvasContext.ONE_MINUS_SRC_ALPHA);
	
	var canvasContext = globalResources.getMainCanvasContext();
	this.buildShaderPrograms(canvasContext);
	
	var constStartingLevelIndex = 0;
	
	var sceneInstance = this;
	function finalizeInitialization () {
		// Prepare the gameplay level for use.
		sceneInstance.setupNewLevelState(constStartingLevelIndex);
		sceneInstance.setupInputEventHandler();
		
		if (Utility.validateVar(completionFunction)) {
			completionFunction();
		}
	}
	
	this.generateDynamicElementPredeterminedMatrices();
	this.prepareGeometricRenderData(finalizeInitialization);
}

/**
 * Compiles all WebGL shader programs required to render
 *  a scene
 *
 * @param canvasContext {WebGLRenderingContext2D} WebGL context that is required to
 *                                                compile shader programs
 *
 */
MainLittleHelpersGameplayScene.prototype.buildShaderPrograms = function(canvasContext) {
	var vertexShaderStandardPositionTransformSource = globalResources.getLoadedResourceDataByKey(globalResources.keyVertexShaderStandardPosition)
	var fragmentShaderGouraud = globalResources.getLoadedResourceDataByKey(globalResources.keyFragmentShaderGouraud);
	var fragmentShaderBackdrop = globalResources.getLoadedResourceDataByKey(globalResources.keyFragmentShaderBackdrop);
	var fragmentShaderBlackFader = globalResources.getLoadedResourceDataByKey(globalResources.keyFragmentShaderBlackFader);
	var fragmentShaderColorMonoVertSplit = globalResources.getLoadedResourceDataByKey(globalResources.keyFragmentShaderVerticalColorMonoSplitFraction);
	var fragmentShaderStandardTexture = globalResources.getLoadedResourceDataByKey(globalResources.keyFragmentShaderStandardTexture);
	this.shaderStandardObject = WebGlUtility.createShaderProgram(canvasContext, vertexShaderStandardPositionTransformSource.resourceDataStore, fragmentShaderGouraud.resourceDataStore);
	this.shaderStandardTexturedObject = WebGlUtility.createShaderProgram(canvasContext, vertexShaderStandardPositionTransformSource.resourceDataStore, fragmentShaderStandardTexture.resourceDataStore);
	this.shaderBackdropRender = WebGlUtility.createShaderProgram(canvasContext, vertexShaderStandardPositionTransformSource.resourceDataStore, fragmentShaderBackdrop.resourceDataStore);
	this.shaderBlackFader = WebGlUtility.createShaderProgram(canvasContext, vertexShaderStandardPositionTransformSource.resourceDataStore, fragmentShaderBlackFader.resourceDataStore);
	this.shaderColorMonoSplit = WebGlUtility.createShaderProgram(canvasContext, vertexShaderStandardPositionTransformSource.resourceDataStore, fragmentShaderColorMonoVertSplit.resourceDataStore);
	this.shaderStandardOverlayTextureRender = WebGlUtility.createShaderProgram(canvasContext, vertexShaderStandardPositionTransformSource.resourceDataStore, fragmentShaderStandardTexture.resourceDataStore);
}

/**
 * Generates data required to render representations of
 *  procedurally-generated geometry data (e.g. level
 *  tile cubes)
 */
MainLittleHelpersGameplayScene.prototype.prepareGeneratedGeometryRenderData = function() {
	var boxWidth = this.levelScaleFactorX;
	var boxHeight = this.levelScaleFactorY;
	var boxDepth = this.levelScaleFactorZ;
	
	var tileBoxGenerator = new TessellatedBoxGenerator(boxWidth, boxHeight, boxDepth, new Point3d(0.0, 0.0, 0.0));
	if (tileBoxGenerator.generateGeometry()) {
		var tileBoxGeometry = tileBoxGenerator.getTriangleList();
		
		var aggregateVertexData = WebGlUtility.generateAggregateVertexDataFromTriangleList(tileBoxGeometry);
		this.webGlBufferDataLeveTileCube = WebGlUtility.createWebGlBufferDataFromAggregateVertexData(globalResources.getMainCanvasContext(),
			aggregateVertexData, this.constVertexSize);
	}
}

/**
 * Determines the dimensions of a render-space bounding cube that is
 *  derived from a provided set of vertices.
 *
 * @param modelVertexData {ObjFormatBufferParserUtility.ModelVertexDataContainer} Object which encapsulates a
 *                                                                                collection of vertices
 */
MainLittleHelpersGameplayScene.prototype.modelDimensionsFromModelVertexData = function (modelVertexData) {
	var modelDimensions = new ModelDimensions();
		
	if (Utility.validateVarAgainstType(modelVertexData, ObjFormatBufferParserUtility.ModelVertexDataContainer)) {	
		modelDimensions.dimensionX = modelVertexData.modelDimensionX;
		modelDimensions.dimensionY = modelVertexData.modelDimensionY;
		modelDimensions.dimensionZ = modelVertexData.modelDimensionZ;
	}
	
	return modelDimensions;
}

/**
 * Builds pre-determined matrices that are required to properly orient
 *  models, as necessary
 */
MainLittleHelpersGameplayScene.prototype.generateDynamicElementPredeterminedMatrices = function () {
	var enemyKeys = this.getAllEnemyKeys();

	for (currentEnemyKey of enemyKeys) {
		var transformationMatrix = null;
		switch (currentEnemyKey) {
			case globalResources.keyModelEnemyGrinch:
				var rotationAngleAxisY = Math.PI;
				this.modelMatrixKeyValStore[currentEnemyKey] = MathUtility.generateRotationMatrix3dAxisY(rotationAngleAxisY);
				break;
			case globalResources.keyModelEnemyCoronaVirusMonster:
				var rotationAngleAxisY = Math.PI;
				this.modelMatrixKeyValStore[currentEnemyKey] = MathUtility.generateRotationMatrix3dAxisY(rotationAngleAxisY);			
				break;
			default:
				break;
		}
		
		if (transformationMatrix !== null) {
			this.modelMatrixKeyValStore[currentEnemyKey] = transformationMatrix;
		}
	}
}

/**
 * Decodes model data in preparation for rendering, applying any required
 *  post-processing, as necessary; reports progress visually during the
 *  preparation process. 
 *
 * completionFunction {function} Function invoked upon the completion of model data
 *                               preparation
 */
MainLittleHelpersGameplayScene.prototype.prepareModelRenderData = function (completionFunction) {
	var modelKeys = this.getAllModelKeys();
	
	this.renderModelPreparationProgressIndicatorImmediate(0);
	
	if (modelKeys.length > 0) {
		var preparedModelCount = 0;
		
		
		for (var currentModelKey of modelKeys) {
				
			var sceneInstance = this;				
			function scheduleModelPreparation(targetModelKey) {
				
				function prepareModel () {
					sceneInstance.prepareModelRenderDataFromKeyedObjBuffer(targetModelKey);
					preparedModelCount++;
					sceneInstance.renderModelPreparationProgressIndicatorImmediate(preparedModelCount / modelKeys.length);
					
					if (preparedModelCount === modelKeys.length) {					
						setTimeout(completionFunction, 0);
					}
				}				
				setTimeout(prepareModel, 0);
			}
			
			scheduleModelPreparation(currentModelKey);
		}
		
	}
}

/**
 * Decodes render model data, encoded in OBJ model format, and applies an
 *  required pre-processing in preparation for use
 *
 * @param modelKey {String} Key used to access the model data which exists
 *                          in the resource key-value store.
 *
 */
MainLittleHelpersGameplayScene.prototype.prepareModelRenderDataFromKeyedObjBuffer = function (modelKey) {
	if (Utility.validateVar(modelKey)) {
		vertexDefProcessorBoundsNormalizer = new ObjFormatBufferParserUtility.ObjVertexDefProcessorObjectBoundsNormalizer()
		vertexDefProcessorBoundsNormalizer.unitScalingFactor = this.constModelInitializationScaleFactors[modelKey];
		var objBufferSource = globalResources.getLoadedResourceDataByKey(modelKey);
		var modelVertexData = ObjFormatBufferParserUtility.generateModelVertexDataFromObjBuffer(objBufferSource.resourceDataStore,
			vertexDefProcessorBoundsNormalizer, null, null);
		this.modelRefDimensionKeyValStore[modelKey] = this.modelDimensionsFromModelVertexData(modelVertexData);

		this.webGlBufferDataKeyValStore[modelKey] = 
			WebGlUtility.createWebGlBufferDataFromAggregateVertexData(globalResources.getMainCanvasContext(),
			modelVertexData.aggregateVertexData, this.constVertexSize);						
	}
}

/**
 * Renders a visual representation of a provided operation progress
 *  fraction value
 *
 * @param progressFraction {Number} Number representing an
 *                                  approximate progress fraction (0.0 - 1.0,
 *                                  inclusive)
 *
 * @see MainLittleHelpersGameplayScene.prepareModelRenderData
 */
MainLittleHelpersGameplayScene.prototype.renderModelPreparationProgressIndicatorImmediate = function (progressFraction) {
	if (Utility.validateVar(progressFraction)) {
		var overlayTexture = globalResources.textureKeyValueStore[globalResources.keyTextureHourglass];
		
		// The "color split" shader divides the screen vertically, rendering
		// one vertical section of the screen in color, while rendering
		// the other section of the screen in monochrome. The fractional
		// portion indicates the section of the screen that will
		// be rendered in color.
		var colorSplitProgressRenderWebGlData = WebGlUtility.objectRenderWebGlDataFromWebGlBufferData(	
			this.progressOverlayWebGlData, this.shaderColorMonoSplit);
		
		var canvasContext = globalResources.getMainCanvasContext();
		var transformationMatrix = new MathExt.Matrix(this.constTransformationMatrixRowCount,
			this.constTransformationMatrixColumnCount);
		transformationMatrix.setToIdentity();
		var webGlAttributeLocationData = this.getStandardShaderWebGlAttributeLocations(true);
		var webGlAttributeData = this.getDefaultWebGlAttributeData();	

		function colorSplitFractionUniformSetup(shaderProgram) {
			var textureOffsetUniformLocation = canvasContext.getUniformLocation(shaderProgram, "splitFraction");
			canvasContext.uniform1f(textureOffsetUniformLocation, progressFraction);
		}
		
		canvasContext.clear(canvasContext.COLOR_BUFFER_BIT);
		WebGlUtility.renderGeometry(colorSplitProgressRenderWebGlData, transformationMatrix, overlayTexture,
			canvasContext, webGlAttributeLocationData, webGlAttributeData, colorSplitFractionUniformSetup);
		canvasContext.finish();
	}
}

/**
 * Prepares all procedural and pre-generated geometry data for
 *  use
 *
 * completionFunction {function} Function invoked upon the completion of model data
 *                               preparation
 */
MainLittleHelpersGameplayScene.prototype.prepareGeometricRenderData = function(completionFunction) {
	this.prepareRenderDataForProgressOverlay();
	this.prepareRenderDataForBackdrop();
	this.prepareRenderDataForGoalStatusOverlay();
	this.prepareRenderDataForGaugeOverlay();
	this.prepareRenderDataForFullScreenOverlay();	
	this.prepareGeneratedGeometryRenderData();
	this.prepareModelRenderData(completionFunction);
}

/**
 * Creates WebGL buffers for the full-screen overlay quad, ensuring that data
 *  can be immediately rendered
 */
MainLittleHelpersGameplayScene.prototype.prepareRenderDataForProgressOverlay = function() {
	var webGlBufferData = new WebGlUtility.WebGlBufferData();	
		
	webGlBufferData.objectWebGlVertexBuffer = WebGlUtility.createWebGlBufferFromData(globalResources.getMainCanvasContext(),
		this.progressOverlayVertices);
	webGlBufferData.objectWebGlTexCoordBuffer = WebGlUtility.createWebGlBufferFromData(globalResources.getMainCanvasContext(),
		this.overlayTextureCoords);
		
	webGlBufferData.vertexCount = this.progressOverlayVertices.length / this.constVertexSize;
	
	this.progressOverlayWebGlData = webGlBufferData;
}

/**
 * Creates WebGL buffers for the backdrop quad, ensuring that data
 *  can be immediately rendered
 */
MainLittleHelpersGameplayScene.prototype.prepareRenderDataForBackdrop = function() {	
	var webGlBufferData = new WebGlUtility.WebGlBufferData();
	
	webGlBufferData.objectWebGlVertexBuffer = WebGlUtility.createWebGlBufferFromData(globalResources.getMainCanvasContext(),
		this.backdropVertices);
	webGlBufferData.objectWebGlTexCoordBuffer = WebGlUtility.createWebGlBufferFromData(globalResources.getMainCanvasContext(),
		this.backdropTextureCoords);
		
	webGlBufferData.vertexCount = this.backdropVertices.length / this.constVectorSize;
	
	this.backdropRenderWebGlData = webGlBufferData;
}

/**
 * Creates WebGL buffers for the goal overlay quad, ensuring that data
 *  can be immediately rendered
 */
MainLittleHelpersGameplayScene.prototype.prepareRenderDataForGoalStatusOverlay = function() {
	var webGlBufferData = new WebGlUtility.WebGlBufferData();
	
	webGlBufferData.objectWebGlVertexBuffer = WebGlUtility.createWebGlBufferFromData(globalResources.getMainCanvasContext(),
		this.goalStatusOverlayVertices);
	webGlBufferData.objectWebGlTexCoordBuffer = WebGlUtility.createWebGlBufferFromData(globalResources.getMainCanvasContext(),
		this.overlayTextureCoords);

	webGlBufferData.vertexCount = this.goalStatusOverlayVertices.length / this.constVertexSize;

	this.goalStatusOverlayRenderWebGlData = webGlBufferData; 
}

/**
 * Creates WebGL buffers for the gauge overlay quad, ensuring that data
 *  can be immediately rendered
 */
MainLittleHelpersGameplayScene.prototype.prepareRenderDataForGaugeOverlay = function() {
	var webGlBufferData = new WebGlUtility.WebGlBufferData();
	
	webGlBufferData.objectWebGlVertexBuffer = WebGlUtility.createWebGlBufferFromData(globalResources.getMainCanvasContext(),
		this.gaugeOverlayVertices);
	webGlBufferData.objectWebGlTexCoordBuffer = WebGlUtility.createWebGlBufferFromData(globalResources.getMainCanvasContext(),
		this.overlayTextureCoords);

	webGlBufferData.vertexCount = this.gaugeOverlayVertices.length / this.constVertexSize;	
	
	this.gaugeOverlayRenderWebGlData = webGlBufferData;
}

/**
 * Creates WebGL buffers for the full-screen overlay quad, ensuring that data
 *  can be immediately rendered
 */
MainLittleHelpersGameplayScene.prototype.prepareRenderDataForFullScreenOverlay = function() {
	var webGlBufferData = new WebGlUtility.WebGlBufferData();	
		
	webGlBufferData.objectWebGlVertexBuffer = WebGlUtility.createWebGlBufferFromData(globalResources.getMainCanvasContext(),
		this.fullScreenOverlayVertices);
	webGlBufferData.objectWebGlTexCoordBuffer = WebGlUtility.createWebGlBufferFromData(globalResources.getMainCanvasContext(),
		this.overlayTextureCoords);
		
	webGlBufferData.vertexCount = this.fullScreenOverlayVertices.length / this.constVertexSize;
	
	this.fullScreenOverlayWebGlData = webGlBufferData;
}

/**
 * Configures all gameplay factors that are associated with the
 *  initiation of properly-functioning initial-state level
 *  environment.
 *
 * @param levelIndex {Number} Index of the level that is to be initialized
 *                            to an initial-state status
 */
MainLittleHelpersGameplayScene.prototype.setupNewLevelState = function (levelIndex) {	
	this.currentPositionInLevel = new Point3d(0.0, 0.0, 0.0);
	this.currentLegoProtagonistWorldSpacePosition = new Point3d(
		this.constLegoProtagonistStartingWorldSpacePosition.getX(),
		this.constLegoProtagonistStartingWorldSpacePosition.getY(),
		this.constLegoProtagonistStartingWorldSpacePosition.getZ());
	this.currentLegoProtagonistAmbulationAccelerationAxisX = 0;
	this.currentLegoProtagonistVelocity = new Vector3d(0.0, 0.0, 0.0);
	this.initializeAdditionalLegoProtagonistModelDisplacements();
	this.currentLevelIndex = Utility.returnValidNumOrZero(levelIndex);
	
	this.currentLegoProtagonistAnimationType = this.constLegoProtagonistAnimationTypeStationary;
	this.currentLegoProtagonistAnimationStartTimeMs = this.totalElapsedSceneTimeMs;	
	this.currentLegoProtagonistRenderIntervalFrameCount = 0;
	this.currentLegoProtagonistStaticModelDirectionBias = 1;
	this.currentLegoProtagonistInvulnerabilityStartTimeMs = this.totalElapsedSceneTimeMs;
	this.legoProtagonistCurrentHealth = this.constLegoProtagonistMaxHealth;
	this.goalItemInstanceDataCollection.splice(0);
	this.enemyInstanceDataCollection.splice(0);
	this.discoveredGoalItemCount = 0;
	this.gameEndOverlayContentHasBeenGenerated = false;	
	this.setOperationState(this.constOperationStateActive);
	
	this.setupLevelEnvironment();
}

/**
 * Parses the encoded representation of the current level, building the level, and
 *  initializes factors specific to level arrangement.
 */
MainLittleHelpersGameplayScene.prototype.setupLevelEnvironment = function () {	
	if ((this.currentLevelIndex >= 0) && (this.currentLevelIndex < this.levelKeyCollection.length)) {
		
		// Parse the loaded level...
		var rawLevelData = globalResources.getLoadedResourceDataByKey(this.levelKeyCollection[this.currentLevelIndex]);
		var levelSpecificationParser = new SpatialLevelSpecificationParser();
		levelSpecificationParser.parseSpatialLevelSpecificationBuffer(rawLevelData.resourceDataStore);
		
		var levelRepresentation = new LevelRepresentation(levelSpecificationParser);
		levelRepresentation.setScaleFactors(this.levelScaleFactorX, this.levelScaleFactorY, this.levelScaleFactorZ);
		
		this.currentLevelRepresentation = levelRepresentation;
		
		var levelTileOffset = levelRepresentation.computeInitialTileOffset();
		this.currentPositionInLevel = new Point3d(-levelTileOffset.getX(), -levelTileOffset.getY(), -levelTileOffset.getZ());
		
		if (Utility.validateVar(levelRepresentation.levelBackdropSpecifier)) {
			this.currentBackdropTextureKey = this.levelBuiltInTextureToTextureKeyDict[levelRepresentation.levelBackdropSpecifier];
		}
		
		// Extract level symbols that will be used as dynamic element (e.g.
		// collectible items, enemies).
		this.extractDynamicLevelSymbolsFromCurrentLevel();		
	}
}

/**
 * Extracts level symbols - elements that are encoded into the
 *  level that are not static level tiles - and properly
 *  places the represented item instances data into the level.
 */
MainLittleHelpersGameplayScene.prototype.extractDynamicLevelSymbolsFromCurrentLevel = function () {
	if (Utility.validateVarAgainstType(this.currentLevelRepresentation, LevelRepresentation)) {
		
		var levelGridWidth = this.currentLevelRepresentation.getTileGridWidth();
		var levelGridHeight = this.currentLevelRepresentation.getTileGridHeight();
		
		for (var rowLoop = 0; rowLoop < levelGridHeight; rowLoop++) {
			for (var columnLoop = 0; columnLoop < levelGridWidth; columnLoop++) {			
				var tileAttributes = this.currentLevelRepresentation.getTileAttributesForTileAtPosition(rowLoop, columnLoop);
			
				if (tileAttributes !== null) {
					if (this.conditionallyExtractDynamicLevelSymbol(rowLoop, columnLoop)) {
						this.currentLevelRepresentation.makeTileEmptySpaceTile(rowLoop, columnLoop);	
					}					
				}
			}
		}			
	}
}

/**
 * Conditionally extracts a dynamic level element symbol - the
 *  extraction occurs only if the item at the specified level
 *  tile coordinates is a valid dynamic symbol
 *
 * @param rowIndex {Number} Index which references a row within the level tile
 *                          grid collection representation
 *
 * @param columnIndex {Number} Index which represents a column with the level
 *                             tile grid representation
 *
 * @return {Boolean} True if a dynamic level element was successfully
 *                   extracted
 */
MainLittleHelpersGameplayScene.prototype.conditionallyExtractDynamicLevelSymbol = function(rowIndex, columnIndex) {
	var extractedSuccessfully = false;
	
	if (Utility.validateVarAgainstType(this.currentLevelRepresentation, LevelRepresentation) &&
		Utility.validateVar(rowIndex) && Utility.validateVar(columnIndex)) {
			
		var tileAttributes = this.currentLevelRepresentation.getTileAttributesForTileAtPosition(rowIndex, columnIndex);
		if ((tileAttributes !== null) && this.isDynamicLevelElementSymbol(tileAttributes)) {

			var levelPositionX = this.currentPositionInLevel.getX();
			var levelPositionY = this.currentPositionInLevel.getY();			
			var tileRectInLevelSpace = this.currentLevelRepresentation.getTileRectInLevelSpace(rowIndex, columnIndex,
				-levelPositionX, -levelPositionY);
			
			extractedSuccessfully = this.buildDynamicLevelElement(tileRectInLevelSpace, tileAttributes);
		}			
	}
	
	return extractedSuccessfully;
}

/**
 * Determines if a particular level tile, represented by a collection of
 *  tile attributes, defines a dynamic level element symbol (non-static
 *  tile, such as an enemy instance)
 *
 * @param tileAttributes {Object} Object with attributes that detail the
 *                                tile instance representation
 *
 * @return {Boolean} True if the provided tile attributes represent a dynamic level
 *                   element symbol
 */
MainLittleHelpersGameplayScene.prototype.isDynamicLevelElementSymbol = function (tileAttributes) {
	return (Utility.validateVar(tileAttributes) && Utility.validateVar(tileAttributes.elementType));
}

/**
 * Creates a dynamic level element, using a particular set of object
 *  attributes.
 *
 * @param tileAttributes {Object} Attributes that define the dynamic element
 *                                to be created
 *
 * @return {DynamicItemInstanceData/EnemyInstanceData} Object which represents the appropriate
 *                                                     dynamic element
 */
MainLittleHelpersGameplayScene.prototype.createDynamicLevelElement = function (tileAttributes) {
	var dynamicLevelElement = null;

	if (Utility.validateVar(tileAttributes)) {		
		switch (tileAttributes.elementType) {
			case this.constLevelSymbolTypeGoalSpecifier:
				dynamicLevelElement = new DynamicItemInstanceData();
				break;
			case this.constLevelSymbolTypeEnemySpecifier:
				dynamicLevelElement = new EnemyInstanceData();
				if (Utility.validateVar(tileAttributes.contactDamage)) {
					dynamicLevelElement.contactDamage = Utility.returnValidNumOrZero(tileAttributes.contactDamage);
				}
				
				if (Utility.validateVar(tileAttributes.initMovementVelocityHoriz)) {
					dynamicLevelElement.velocityVector.xComponent = tileAttributes.initMovementVelocityHoriz / Constants.millisecondsPerSecond;
				}
				
				if (Utility.validateVar(tileAttributes.initMovementVelocityVert)) {
					dynamicLevelElement.velocityVector.yComponent = tileAttributes.initMovementVelocityVert / Constants.millisecondsPerSecond;
				}
				break;					
			default:
				break;
		}
	}
	
	this.applyDynamicElementBaseAttributes(dynamicLevelElement, tileAttributes);
	
	return dynamicLevelElement;
}

/**
 * Builds a dynamic level element from the provided data, storing the element in
 *  the appropriate internal instance store
 *
 * @param tileRect {Rectangle} Bounding rectangle in the X-Y plane which defines the dynamic
 *                   element X-Y plane level/render-space boundaries
 * @param tileAttributes {Object} 
 *
 *
 * @return {Boolean} True if the provided tile attributes represent a dynamic level
 *                   element symbol
 */
MainLittleHelpersGameplayScene.prototype.buildDynamicLevelElement = function (tileRect, tileAttributes) {
	var builtSuccessfully = false;

	if (Utility.validateVar(tileAttributes)) {				
		var renderSpaceCenterX = tileRect.left + (tileRect.getWidth() / 2.0);
		var renderSpaceCenterY = tileRect.top - (tileRect.getHeight() / 2.0);

		var dynamicLevelElement = this.createDynamicLevelElement(tileAttributes);
			
		dynamicLevelElement.modelWorldSpacePosition =
			this.translatedRenderSpacePositionToWorldSpacePosition(renderSpaceCenterX,
			renderSpaceCenterY, 0.0);
		builtSuccessfully = this.storeDynamicLevelSymbolByType(dynamicLevelElement);
	}
	
	return builtSuccessfully;
}

/**
 * Applies defining attributes to a newly-created level element,
 *  finalizing the creation of a dynamic element
 *
 * @param levelElement {DynamicItemInstanceData/EnemyInstanceData} Dynamic level element which
 *                                                                 does not yet have specific
 *                                                                 attributes assigned
 * @param tileAttributes {Object} Collection of attributes to be assigned to/interpreted for
 *                                the levelElement
 */
MainLittleHelpersGameplayScene.prototype.applyDynamicElementBaseAttributes = function (levelElement, tileAttributes) {
	if (Utility.validateVar(tileAttributes) && Utility.validateVar(tileAttributes.builtInModel)) {
		var modelKey = this.levelBuiltInModelSymbolToModelKeyDict[tileAttributes.builtInModel];
	
		if ((typeof this.webGlBufferDataKeyValStore[modelKey] !== "undefined") &&
			(typeof this.modelRefDimensionKeyValStore[modelKey] !== "undefined")) {	
				levelElement.modelDataKey = modelKey;		
		}		
	}	
}

/**
 * Stores a dynamic level symbol within the appropriate item instance collection
 *
 * @param levelElement {DynamicItemInstanceData/EnemyInstanceData} Dynamic level item
 *                                                                 instance to be stored
 *
 */
MainLittleHelpersGameplayScene.prototype.storeDynamicLevelSymbolByType = function (levelElement) {
	var storedSuccessfully = true;
	
	if (Utility.validateVarAgainstType(levelElement, DynamicItemInstanceData)) {
		this.goalItemInstanceDataCollection.push(levelElement);
	}
	else if (Utility.validateVarAgainstType(levelElement, EnemyInstanceData)) {
		this.enemyInstanceDataCollection.push(levelElement);
	}
	else {
		storedSuccessfully = false;
	}
	
	return storedSuccessfully;
}

/**
 * Intializes the table that is used to provide "additional" displacements to the
 *  lego protagonist model components. (These displacements are used to apply
 *  the "game over" state component dispersion animation).
 */
MainLittleHelpersGameplayScene.prototype.initializeAdditionalLegoProtagonistModelDisplacements = function () {
	for (var currentKey in this.constLegoProtagonistModelBaseAdditionalDisplacements) {
		this.modelAdditionalDisplacementKeyValStore[currentKey] = new Vector3d(0.0, 0.0, 0.0);
	}
}

/**
 * Initializes game input bindings
 */
MainLittleHelpersGameplayScene.prototype.setupInputEventHandler = function () {	
	// Bind the keyboard input events...		
	this.inputEventInterpreter.bindInputEventToFunction(this.keyboardInputEventReceiver,
		this.keyboardInputEventReceiver.constKeySpecifierArrowLeft,	
		this, this.handleInputForLegoProtagonistlMovementLeft);
		
	this.inputEventInterpreter.bindInputEventToFunction(this.keyboardInputEventReceiver,
		this.keyboardInputEventReceiver.constKeySpecifierArrowRight,	
		this, this.handleInputForLegoProtagonistMovementRight);
		
	this.inputEventInterpreter.bindInputEventToFunction(this.keyboardInputEventReceiver,
		this.keyboardInputEventReceiver.constKeySpecifierSpace,	
		this, this.handleInputForLegoProtagonistJump);
		
	// Bind the device orientation input events (mobile devices, etc.)
	this.inputEventInterpreter.bindInputEventToFunction(this.deviceAttitudeInputEventReceiver,
		this.deviceAttitudeInputEventReceiver.constAttitudeEffectiveTiltInputSpecifierLeft,
		this, this.handleInputForLegoProtagonistlMovementLeft);
		
	this.inputEventInterpreter.bindInputEventToFunction(this.deviceAttitudeInputEventReceiver,
		this.deviceAttitudeInputEventReceiver.constAttitudeEffectiveTiltInputSpecifierRight,
		this, this.handleInputForLegoProtagonistMovementRight);
		
	// Bind the device touch input event (mobile devices, etc.)
	this.inputEventInterpreter.bindInputEventToFunction(this.deviceTouchInputEventReceiver,
		this.deviceTouchInputEventReceiver.constTouchInputSpecifier,
		this, this.handleInputForLegoProtagonistJump);
}

/**
 * Input handler for the input message(s) which represent the
 *  "move left" action
 *
 * @param scalarInputEvent {ScalarInputEvent} Scalar-based input event which represents
 *                                            an input message that can represent varying
 *                                            input magnitudes
 */
MainLittleHelpersGameplayScene.prototype.handleInputForLegoProtagonistlMovementLeft = function (scalarInputEvent) {
	if (Utility.validateVarAgainstType(scalarInputEvent, ScalarInputEvent) && this.isInActiveOperationState()) {	
		this.currentLegoProtagonistAmbulationAccelerationAxisX = -this.legoProtagonistAmbulationAccelerationMetersPerMsSq *
			Math.pow(scalarInputEvent.inputUnitMagnitude, this.constDeviceAccelResultExpoFactor);
	}
}

/**
 * Input handler for the input message(s) which represent the
 *  "move right" action
 *
 * @param scalarInputEvent {ScalarInputEvent} Scalar-based input event which represents
 *                                            an input message that can represent varying
 *                                            input magnitudes
 */
MainLittleHelpersGameplayScene.prototype.handleInputForLegoProtagonistMovementRight = function (scalarInputEvent) {
	if (Utility.validateVarAgainstType(scalarInputEvent, ScalarInputEvent) && this.isInActiveOperationState()) {	
		this.currentLegoProtagonistAmbulationAccelerationAxisX = this.legoProtagonistAmbulationAccelerationMetersPerMsSq *
			Math.pow(scalarInputEvent.inputUnitMagnitude, this.constDeviceAccelResultExpoFactor);
	}	
}

/**
 * Input handler for the input message(s) which represent the
 *  "jump" action
 *
 * @param scalarInputEvent {ScalarInputEvent} Scalar-based input event which represents
 *                                            an input message that can represent varying
 *                                            input magnitudes
 */
MainLittleHelpersGameplayScene.prototype.handleInputForLegoProtagonistJump = function(scalarInputEvent) {
	if (Utility.validateVarAgainstType(scalarInputEvent, ScalarInputEvent)) {		
		if (this.isInActiveOperationState()) {
			if (this.isLegoProtagonistInContactWithHorizSurface() && (scalarInputEvent.inputUnitMagnitude > 0)) {
				this.legoProtagonistJumpInitiated = true;
			}
		}
		else if (this.isInGameOverState()) {
			this.setupNewLevelState(this.currentLevelIndex);
		}
		else if (this.isInGameCompletionState() && (scalarInputEvent.inputUnitMagnitude > 0)) {
			this.setupNewLevelState(0);
		}
	}
}

/**
 * Returns a collection of enemy keys used in a key-value
 *  store
 *
 * @return {Array} A collection of enemy keys
 */
MainLittleHelpersGameplayScene.prototype.getAllEnemyKeys = function () {
	
	var enemyKeys =
	[
		globalResources.keyModelEnemyGrinch,
		globalResources.keyModelEnemyCoronaVirusMonster
	];
	
	return enemyKeys;
}

/**
 * Returns the specific collection of keys that are used
 *  to reference model geometry which represents the
 *  lego protagonist within the model key-value store
 *
 * @return {Array} A collection of lego protagonist keys
 */
MainLittleHelpersGameplayScene.prototype.getAllLegoProtagonistComponentKeys = function() {
	var legoProtagonistComponentKeys =
	[
		globalResources.keyModelLegoProtagonistHead,
		globalResources.keyModelLegoProtagonistHips,
		globalResources.keyModelLegoProtagonistTorso,
		globalResources.keyModelLegoProtagonistLeftArm,
		globalResources.keyModelLegoProtagonistRightArm,
		globalResources.keyModelLegoProtagonistLeftLeg,
		globalResources.keyModelLegoProtagonistRightLeg
	];
	
	return legoProtagonistComponentKeys;
}

/**
 * Returns all keys that are used to access models within
 *  the key-value store
 *
 * @return {Array} A collection of lego protagonist keys
 */
MainLittleHelpersGameplayScene.prototype.getAllModelKeys = function () {
	var enemyKeys = this.getAllEnemyKeys();
	var legoProtagonistKeys = this.getAllLegoProtagonistComponentKeys();
	var allModelKeys = legoProtagonistKeys.concat(enemyKeys);
	
	return allModelKeys;
}

/**
 * Computes a completion fraction for the stationary lego
 *  protagonist "animation"
 * 
 * @param animationTimeMs {Number} current duration of the animation (milliseconds)
 *
 * @return {Number} 0.0 - the stationary position "animation" duration is indefinite
 */
MainLittleHelpersGameplayScene.prototype.computeLegoProtagonistStationaryAnimCompletionFrac = function (animationTimeMs) {
	// Stationary pose has an indefinite duration
	return 0.0;
}

/**
 * Computes a completion fraction for the ambulation lego
 *  protagonist animation
 * 
 * @param animationTimeMs {Number} current duration of the animation (milliseconds)
 *
 * @return {Number} Lego protagonist ambulation animation completion fraction
 */
MainLittleHelpersGameplayScene.prototype.computeLegoProtagonistAmbulationAnimCompletionFrac = function (animationTimeMs) {
	var completionFraction = 0.0;
	
	var constAmbulationAnimPeriodMs = 850.0;

	// The ambulation animation is cyclical...
	var constSineFullPeriod = Math.PI * 2.0;
	
	var sineValue = Math.sin((animationTimeMs / constAmbulationAnimPeriodMs) * constSineFullPeriod);
	completionFraction = (sineValue + 1.0) / 2.0;
	
	
	return completionFraction;
}

/**
 * Computes a completion fraction for the jump lego
 *  protagonist "animation"
 * 
 * @param animationTimeMs {Number} current duration of the animation (milliseconds)
 *
 * @return {Number} 0.0 - the jump "animation" duration is indefinite
 */
MainLittleHelpersGameplayScene.prototype.computeLegoProtagonistJumpAnimCompletionFrac = function (animationTimeMs) {
	// Jumping pose has an indefinite duration
	return 0.0;
}

/**
 * Computes a completion fraction for the damage reception lego
 *  protagonist animation
 * 
 * @param animationTimeMs {Number} current duration of the animation (milliseconds)
 *
 * @return {Number} Lego protagonist damage reception animation completion fraction
 */
MainLittleHelpersGameplayScene.prototype.computeLegoProtagonistDamageRecAnimCompletionFrac = function (animationTimeMs) {	
	var constDamageReceptionAnimationDurationMs = 300.0;
	
	var completionFraction = Utility.returnValidNumOrZero(animationTimeMs) / constDamageReceptionAnimationDurationMs;

	return completionFraction;
}

/**
 * Computes a completion fraction for the currently-active lego protagonist
 *  animation
 * 
 * @param animationTimeMs {Number} current duration of the animation (milliseconds)
 *
 * @return {Number} Current animation completion fraction
 */
MainLittleHelpersGameplayScene.prototype.computeLegoProtagonistAnimCompletionFraction = function () {
	var animationCompletionFraction = 0.0;

	var animationRunningTimeMs = (this.isInActiveOperationState() ? this.totalElapsedSceneTimeMs : this.gameActivityEndTimeMs) -
		this.currentLegoProtagonistAnimationStartTimeMs;
	
	if (animationRunningTimeMs >= 0.0) {
		switch (this.currentLegoProtagonistAnimationType) {
			case this.constLegoProtagonistAnimationTypeStationary:
				animationCompletionFraction = this.computeLegoProtagonistStationaryAnimCompletionFrac(animationRunningTimeMs);
				break;
			case this.constLegoProtagonistAnimationTypeAmbulation:
				animationCompletionFraction = this.computeLegoProtagonistAmbulationAnimCompletionFrac(animationRunningTimeMs);
				break;
			case this.constLegoProtagonistAnimationTypeJump:
				animationCompletionFraction = this.computeLegoProtagonistJumpAnimCompletionFrac(animationRunningTimeMs);
				break;
			case this.constLegoProtagonistAnimationTypeDamageReception:
				animationCompletionFraction = this.computeLegoProtagonistDamageRecAnimCompletionFrac(animationRunningTimeMs);
				break;
			default:
				break;
		}
	}
	
	return animationCompletionFraction;
}

/**
 * Determines the currently active animation, based on the position of
 *  the lego protagonist
 *
 * @return {Number} Animation type specifier
 */
MainLittleHelpersGameplayScene.prototype.getAnimationTypeByLegoProtagonistPositionalContext = function () {
	var animationType = this.constLegoProtagonistAnimationTypeStationary;
	
	if (this.isLegoProtagonistInContactWithHorizSurface()) {
		if (Math.abs(this.currentLegoProtagonistAmbulationAccelerationAxisX) > 0) {
			animationType = this.constLegoProtagonistAnimationTypeAmbulation;
		}
	}
	else {
		animationType = this.constLegoProtagonistAnimationTypeJump;
	}
	
	return animationType;
}

/**
 * Updates the animation state (e.g. completion fraction, animation type) of
 *  the animation currently being applied to the lego protagonist
 */
MainLittleHelpersGameplayScene.prototype.updateLegoProtagonistAnimationState = function () {
	var animationCompletionFraction = this.computeLegoProtagonistAnimCompletionFraction();
	
	switch (this.currentLegoProtagonistAnimationType) {
		case this.constLegoProtagonistAnimationTypeDamageReception:
			if (animationCompletionFraction >= 1.0) {
				this.currentLegoProtagonistAnimationType = this.getAnimationTypeByLegoProtagonistPositionalContext();
				this.currentLegoProtagonistAnimationStartTimeMs = this.totalElapsedSceneTimeMs;
			}
			break;
		case this.constLegoProtagonistAnimationTypeJump:		// Intentionally-omitted break statement
		case this.constLegoProtagonistAnimationTypeStationary:	// Intentionally-omitted break statement
		case this.constLegoProtagonistAnimationTypeAmbulation:	// Intentionally-omitted break statement
			this.currentLegoProtagonistAnimationType = this.getAnimationTypeByLegoProtagonistPositionalContext();		
		default:
			break;
	}	
}

/**
 * Updates animation states for all dynamic objects, as necessary
 */
MainLittleHelpersGameplayScene.prototype.updateActorAnimationStates = function() {
	this.updateLegoProtagonistAnimationState();
}

/**
 * Converts a value, represented in world-space units (meters), to render-space
 *  units
 *
 * @param worldSpaceLength {Number} World-space length specification, in meters
 *
 * @return {Number} Render-space length specification
 */
MainLittleHelpersGameplayScene.prototype.worldSpaceLengthToRenderSpaceLength = function (worldSpaceLength) {
	return Utility.returnValidNumOrZero(worldSpaceLength) * this.constWorldScale;
}

/**
 * Converts a value, represented in render-space units, to world-space units
 *  (meters)
 *
 * @param renderSpaceLength {Number} Render-space length specification
 *
 * @return {Number} World-space length specification (meters)
 */
MainLittleHelpersGameplayScene.prototype.renderSpaceLengthToWorldSpaceLength = function (renderSpaceLength) {
	return Utility.returnValidNumOrZero(renderSpaceLength) / this.constWorldScale;
}

/**
 * Converts a point, represented in world-space units (meters), to render-space
 *  units which are translated based on the current protagonist position within
 *  the level (the translation is required to properly render only on-screen
 *  portions of the level)
 *
 * @param worldSpaceLength {Number} World-space length specification, in meters
 *
 * @return {Point3d} Render-space position specification
 */
MainLittleHelpersGameplayScene.prototype.worldSpacePositionToTranslatedRenderSpacePosition = function (coordX, coordY, coordZ) {
	
	var renderSpacePositionX = this.worldSpaceLengthToRenderSpaceLength(coordX) - this.currentPositionInLevel.getX();
	var renderSpacePositionY = this.worldSpaceLengthToRenderSpaceLength(coordY) - this.currentPositionInLevel.getY();
	var renderSpacePositionZ = this.worldSpaceLengthToRenderSpaceLength(coordZ) - this.currentPositionInLevel.getZ();
	
	return new Point3d(renderSpacePositionX, renderSpacePositionY, renderSpacePositionZ);
}

/**
 * Converts a position in three-dimensional world space (meters) to render-space
 *  units
 *
 * @param coordX {Number} X-axis position
 * @param coordY {Number} Y-axis position
 * @param coordZ {Number} Z-axis position
 *
 * @return {Point3d} A position in render-space
 */
MainLittleHelpersGameplayScene.prototype.worldSpacePositionToRenderSpacePosition = function (coordX, coordY, coordZ) {
	var renderSpacePoint = new Point3d(
		this.worldSpaceLengthToRenderSpaceLength(Utility.returnValidNumOrZero(coordX)),
		this.worldSpaceLengthToRenderSpaceLength(Utility.returnValidNumOrZero(coordY)),
		this.worldSpaceLengthToRenderSpaceLength(Utility.returnValidNumOrZero(coordZ)));
	
	return renderSpacePoint;
}

/**
 * Converts a position in three-dimensional render space (meters) to world-space
 *  units
 *
 * @param coordX {Number} X-axis position
 * @param coordY {Number} Y-axis position
 * @param coordZ {Number} Z-axis position
 *
 * @return {Point3d} A position in world space
 */
MainLittleHelpersGameplayScene.prototype.renderSpacePositionToWorldSpacePosition = function (coordX, coordY, coordZ) {
	var renderSpacePoint = new Point3d(
		this.renderSpaceLengthToWorldSpaceLength(Utility.returnValidNumOrZero(coordX)),
		this.renderSpaceLengthToWorldSpaceLength(Utility.returnValidNumOrZero(coordY)),
		this.renderSpaceLengthToWorldSpaceLength(Utility.returnValidNumOrZero(coordZ)));
	
	return renderSpacePoint;	
}

/**
 * Converts a render space coordinate along the X-axis, which has been
 *  tranlsated based on the current protagonist position within the
 *  level, to a corresponding world-space position along the X-axis (meters)
 *
 * @param coordX {Number} Translated render-space position along the X-axis
 *
 * @return {Number} World space position along the X-axis
 */
MainLittleHelpersGameplayScene.prototype.translatedRenderSpaceLengthToWorldSpaceLengthX = function (coordX) {
	return this.renderSpaceLengthToWorldSpaceLength(Utility.returnValidNumOrZero(coordX + this.currentPositionInLevel.getX()));
}

/**
 * Converts a render space coordinate along the Y-axis, which has been
 *  tranlsated based on the current protagonist position within the
 *  level, to a corresponding world-space position along the Y-axis (meters)
 *
 * @param coordY {Number} Translated render-space position along the Y-axis
 *
 * @return {Number} World space position along the Y-axis
 */
MainLittleHelpersGameplayScene.prototype.translatedRenderSpaceLengthToWorldSpaceLengthY = function (coordY) {
	return this.renderSpaceLengthToWorldSpaceLength(Utility.returnValidNumOrZero(coordY + this.currentPositionInLevel.getY()));
}

/**
 * Converts a render space coordinate along the Z-axis, which has been
 *  tranlsated based on the current protagonist position within the
 *  level, to a corresponding world-space position along the Z-axis (meters)
 *
 * @param coordY {Number} Translated render-space position along the Z-axis
 *
 * @return {Number} World space position along the Z-axis
 */
MainLittleHelpersGameplayScene.prototype.translatedRenderSpacePositionToWorldSpacePosition = function (coordX, coordY, coordZ) {
	var renderSpacePoint = new Point3d(
		this.translatedRenderSpaceLengthToWorldSpaceLengthX(coordX),
		this.translatedRenderSpaceLengthToWorldSpaceLengthY(coordY),
		this.renderSpaceLengthToWorldSpaceLength(Utility.returnValidNumOrZero(coordZ + this.currentPositionInLevel.getZ())));

	return renderSpacePoint;
}

/**
 * Determines a bounding box for a dynamic element, specified by a provided key,
 *  in translated render-space units (the translation is required to
 *  properly render the item with its corresponding on-screen
 *  level tile environment)
 *
 * @param worldSpaceCenterPoint {Point3d} Center point of the item, in world space units (meters)
 * @param modelKey {String} Key used to reference the dynamic element within the dynamic element
 *                          key-value store
 *
 * @return {Rectangle} An approximate bounding box for the item, in translated render-space
 *                     coordinates
 */
MainLittleHelpersGameplayScene.prototype.getItemTranslatedRenderSpaceBoundingBox = function (worldSpaceCenterPoint, 
	modelKey) {
		
	var boundingBox = null;
		
	if (Utility.validateVar(worldSpaceCenterPoint) && Utility.validateVar(modelKey)) {
		var renderSpacePosition = this.worldSpacePositionToTranslatedRenderSpacePosition(
			worldSpaceCenterPoint.xCoord, worldSpaceCenterPoint.yCoord, worldSpaceCenterPoint.zCoord);

		boundingBox = new Rectangle(renderSpacePosition.xCoord - this.modelRefDimensionKeyValStore[modelKey].dimensionX / 2.0,
			renderSpacePosition.yCoord + this.modelRefDimensionKeyValStore[modelKey].dimensionY / 2.0,
			this.modelRefDimensionKeyValStore[modelKey].dimensionX,
			this.modelRefDimensionKeyValStore[modelKey].dimensionY);
	}
	
	return boundingBox;
}

/**
 * Returns the approximate minimum X-coordinate of the bounding
 *  box that contains the composite lego protagonist model,
 *  assuming that the model torso is centered at the origin,
 *  and facing in the positive X-axis direction (right)
 *
 * @return {Number} The approximate minimum X-coordinate of
 *                  the bounding box that contains the lego
 *                  protagonist
 */
MainLittleHelpersGameplayScene.prototype.legoProtagonistOrigRefCompositeModelMinX = function () {
	// The back of the head will be used as the minimum X value (reference pose -
	// protagonist facing right).
	return -(this.modelRefDimensionKeyValStore[globalResources.keyModelLegoProtagonistHead].dimensionX / 2.0);	
}

/**
 * Returns the approximate maximum X-coordinate of the bounding
 *  box that contains the composite lego protagonist model,
 *  assuming that the model torso is centered at the origin,
 *  and facing in the positive X-axis direction (right)
 *
 * @return {Number} The approximate maximum X-coordinate of
 *                  the bounding box that contains the lego
 *                  protagonist
 */
MainLittleHelpersGameplayScene.prototype.legoProtagonistOrigRefCompositeModelMaxX = function () {
	// The front of the head will be used as the maximum X value (reference pose -
	// protagonist facing right).
	return (this.modelRefDimensionKeyValStore[globalResources.keyModelLegoProtagonistHead].dimensionX / 2.0);
}

/**
 * Returns the approximate minimum Y-coordinate of the bounding
 *  box that contains the composite lego protagonist model,
 *  assuming that the model torso is centered at the origin,
 *  and facing in the positive X-axis direction (right)
 *
 * @return {Number} The approximate minimum Y-coordinate of
 *                  the bounding box that contains the lego
 *                  protagonist
 */
MainLittleHelpersGameplayScene.prototype.legoProtagonistOrigRefCompositeModelMinY = function () {	
	// The bottom of the legs, translated to be situated at the hip socket, will be
	// used as the minimum Y-axis value.
	var legDimensionY = this.modelRefDimensionKeyValStore[globalResources.keyModelLegoProtagonistLeftLeg].dimensionY;
	
	var pivotRefDisplacementY = legDimensionY * this.modelLegoProtagonistConstrCoeff.constLegPivotRefDisplacementCoeffY;
			
	var hipAttachmentDisplacementY = this.modelRefDimensionKeyValStore[globalResources.keyModelLegoProtagonistHips].dimensionY *
		(this.modelLegoProtagonistConstrCoeff.constHipDisplacementCoeffY + this.modelLegoProtagonistConstrCoeff.constLegOriginHipRelativeDisplacementCoeffY) +
		-(this.modelRefDimensionKeyValStore[globalResources.keyModelLegoProtagonistTorso].dimensionY / 2.0);
		
	var totalLegDisplacementY = pivotRefDisplacementY + hipAttachmentDisplacementY;
	var legLengthBelowPivot = legDimensionY / 2.0;
	
	return (totalLegDisplacementY - legLengthBelowPivot);
}

/**
 * Returns the approximate maximum Y-coordinate of the bounding
 *  box that contains the composite lego protagonist model,
 *  assuming that the model torso is centered at the origin,
 *  and facing in the positive X-axis direction (right)
 *
 * @return {Number} The approximate maximum Y-coordinate of
 *                  the bounding box that contains the lego
 *                  protagonist
 */
MainLittleHelpersGameplayScene.prototype.legoProtagonistOrigRefCompositeModelMaxY = function () {
	// The head model is positioned from the origin by displacing it along the Y-axis by
	// half a torso length; the top of the head is the highest point of the model.
	return this.modelRefDimensionKeyValStore[globalResources.keyModelLegoProtagonistTorso].dimensionY / 2.0 +
		this.modelRefDimensionKeyValStore[globalResources.keyModelLegoProtagonistHead].dimensionY / 2.0;
}

/**
 * Returns the approximate minimum Z-coordinate of the bounding
 *  box that contains the composite lego protagonist model,
 *  assuming that the model torso is centered at the origin,
 *  and facing in the positive X-axis direction (right)
 *
 * @return {Number} The approximate minimum Z-coordinate of
 *                  the bounding box that contains the lego
 *                  protagonist
 */
MainLittleHelpersGameplayScene.prototype.legoProtagonistOrigRefCompositeModelMinZ = function () {
	return 0.0;
}

/**
 * Returns the approximate maximum Z-coordinate of the bounding
 *  box that contains the composite lego protagonist model,
 *  assuming that the model torso is centered at the origin,
 *  and facing in the positive X-axis direction (right)
 *
 * @return {Number} The approximate maximum Z-coordinate of
 *                  the bounding box that contains the lego
 *                  protagonist
 */
MainLittleHelpersGameplayScene.prototype.legoProtagonistOrigRefCompositeModelMaxZ = function () {
	return 0.0;
}

/**
 * Determines a bounding box for the lego protagonist in translated render-space
 *  units (the translation is required to properly render the item with its
 *  corresponding on-screen level tile environment)
 *
 * @return {Rectangle} An approximate bounding box for the item, in translated render-space
 *                     coordinates
 */
MainLittleHelpersGameplayScene.prototype.getLegoProtagonistApproxTranslatedRenderSpaceBoundingBox = function () {
	var translatedRenderSpacePosition = this.worldSpacePositionToTranslatedRenderSpacePosition(
		this.currentLegoProtagonistWorldSpacePosition.xCoord,
		this.currentLegoProtagonistWorldSpacePosition.yCoord,
		this.currentLegoProtagonistWorldSpacePosition.zCoord);
	var legoProtagonistRenderSpaceMinPointY = translatedRenderSpacePosition.yCoord +
		this.legoProtagonistOrigRefCompositeModelMinY();
	var legoProtagonistRenderSpaceMinPointPosition = new Point3d(
		translatedRenderSpacePosition.xCoord,
		legoProtagonistRenderSpaceMinPointY,
		translatedRenderSpacePosition.zCoord);
		
	var boundingBoxWidth = this.legoProtagonistOrigRefCompositeModelMaxX() - this.legoProtagonistOrigRefCompositeModelMinX();
	var boundingBoxHeight = this.legoProtagonistOrigRefCompositeModelMaxY() - this.legoProtagonistOrigRefCompositeModelMinY();
		
	var minValueX = (this.currentLegoProtagonistStaticModelDirectionBias > 0) ?
		(translatedRenderSpacePosition.xCoord + this.legoProtagonistOrigRefCompositeModelMinX()) :
		(translatedRenderSpacePosition.xCoord - this.legoProtagonistOrigRefCompositeModelMaxX());
	var maxValueY = translatedRenderSpacePosition.yCoord + this.legoProtagonistOrigRefCompositeModelMaxY();
		
	return new Rectangle(minValueX, maxValueY, boundingBoxWidth, boundingBoxHeight);
}

/**
 * Determines the current, reference arm rotation angle of the
 *  lego protagonist, based upon the immediate animation
 *  context (left arm reference - angle is negated for
 *  right arm rotation determination)
 *
 * @return {Number} The reference arm rotation angle, in radians
 */
MainLittleHelpersGameplayScene.prototype.currentLegoProtagonistArmRotationAngle = function () {
	var rotationAngle = 0.0;
	
	var constAbsMaxRotationAngleRad = Math.PI / 6.0;
	
	switch (this.currentLegoProtagonistAnimationType) {
		case this.constLegoProtagonistAnimationTypeStationary:
			rotationAngle = 0.0;
			break;
		case this.constLegoProtagonistAnimationTypeJump:
			rotationAngle = Math.PI / 2.0;
			break;
		case this.constLegoProtagonistAnimationTypeDamageReception:
			rotationAngle = Math.PI / 1.4;		
			break;
		case this.constLegoProtagonistAnimationTypeAmbulation:
			var completionFraction = this.computeLegoProtagonistAnimCompletionFraction();
			rotationAngle = ((completionFraction * 2.0) - 1.0) * constAbsMaxRotationAngleRad;
			break;
		default:
			break;
	}
	
	return rotationAngle;
}

/**
 * Returns the immediate direction bias of the lego protagonist model
 *  (indicates the direction that the model should be facing)  
 *  
 * @return {number} Direction (unit value) that the model should be facing - positive
 *                  number indicates the positive X-axis direction (right), while
 *                  a negative number indicates a negative X-axis direction (left)
 */
MainLittleHelpersGameplayScene.prototype.getCurrentLegoProtagonistModelDirectionBias = function () {
	var directionBias = 1.0;
	
	if (this.currentLegoProtagonistAmbulationAccelerationAxisX === 0.0) {
		directionBias = this.currentLegoProtagonistStaticModelDirectionBias;
	}
	else {
		if (this.currentLegoProtagonistAmbulationAccelerationAxisX < 0) {
			directionBias = -1.0;
		}
	}
	
	return directionBias;
}

/**
 * Determines the direction "bias" for the lego protagonist - this value
 *  is used to determine the proper heading orientation of the lego
 *  protagonist model along the X-axis
 *
 * @return Direction bias for the lego protagonist composite model -
 *         -1.0 indicates the the model heading should be oriented
 *         along the negative X-axis direction, while 1.0 indicates that
 *         the model heading should be oriented along the positive
 *         X-axis direction
 */
MainLittleHelpersGameplayScene.prototype.updateLegoProtagonistModelStaticDirectionBias = function() {
	if (this.currentLegoProtagonistAmbulationAccelerationAxisX !== 0.0) {
		this.currentLegoProtagonistStaticModelDirectionBias = (this.currentLegoProtagonistAmbulationAccelerationAxisX < 0) ? -1.0 : 1.0;
	}
}

/**
 * Determines the current, reference leg rotation angle of the
 *  lego protagonist, based upon the immediate animation
 *  context (right leg reference - angle is negated for
 *  left leg rotation determination)
 *
 * @return {Number} The reference leg rotation angle, in radians
 */
MainLittleHelpersGameplayScene.prototype.getCurrentLegoProtagonistLegRotationAngle = function () {
	var rotationAngle = 0.0;

	switch (this.currentLegoProtagonistAnimationType) {
		case this.constLegoProtagonistAnimationTypeDamageReception:
			rotationAngle = Math.PI / 5.0;
			break;
		case this.constLegoProtagonistAnimationTypeStationary:
		case this.constLegoProtagonistAnimationTypeJump:
		case this.constLegoProtagonistAnimationTypeAmbulation:
		default:
			// Determine the angle of the leg based on the current arm angle -
			// the leg swing should demonstrate, to a degree, natural
			// opposing symmetry that is required for a balanced
			// gait.
			var constLegToArmRotationRatio = 0.8;
			rotationAngle = this.currentLegoProtagonistArmRotationAngle() * constLegToArmRotationRatio;		
			break;
	}	
	
	return rotationAngle;
}

/**
 * Returns the transformation matrix required to position the head
 *  of the lego protagonist, assuming that the torso of the lego
 *  protagonist is centered at the render-space origin
 *
 * @return {MathExt.Matrix} Transformation matrix required to properly position the head
 *                          of the lego protagonist relative to an origin-centered torso
 */
MainLittleHelpersGameplayScene.prototype.generateLegoProtagonistHeadMatrix = function () {
	var transformationMatrix = null;	
	
	// The head model is symmetrical within the X-Z plane, and therefore only requires translation.
	var headDisplacementY =
		(this.modelRefDimensionKeyValStore[globalResources.keyModelLegoProtagonistTorso].dimensionY / 2.0);		
	transformationMatrix = MathUtility.generateTranslationMatrix3d(0.0, headDisplacementY, 0.0);
	
	return transformationMatrix
}

/**
 * Returns the transformation matrix required to position the hips
 *  of the lego protagonist, assuming that the torso of the lego
 *  protagonist is centered at the render-space origin
 *
 * @return {MathExt.Matrix} Transformation matrix required to properly position the hips
 *                          of the lego protagonist relative to an origin-centered torso
 */
MainLittleHelpersGameplayScene.prototype.generateLegoProtagonistHipMatrix = function () {
	var transformationMatrix = null;

	// The hips model is centered at the origin, facing forward, upon loading - move the hips
	// downward, and rotate the hips (90°) such that they are oriented appropriately for a
	// character traveling along the X-axis.
	var constHipRotationRadAxisY = Math.PI / 2.0;
	
	var hipDisplacementY =
		((this.modelRefDimensionKeyValStore[globalResources.keyModelLegoProtagonistHips].dimensionY *
			this.modelLegoProtagonistConstrCoeff.constHipDisplacementCoeffY) +
		-(this.modelRefDimensionKeyValStore[globalResources.keyModelLegoProtagonistTorso].dimensionY / 2.0));
	var translationMatrix = MathUtility.generateTranslationMatrix3d(0.0, hipDisplacementY, 0.0);
	var rotationMatrix = MathUtility.generateRotationMatrix3dAxisY(constHipRotationRadAxisY);
	
	transformationMatrix = rotationMatrix.multiply(translationMatrix);

	return transformationMatrix;
}

/**
 * Returns the transformation matrix required to property orient
 *  the torso of the lego protagonist at the render-space origin,
 *  to be used as a positional reference for other lego protagonist
 *  components during compound model composition
 *
 * @return {MathExt.Matrix} Transformation matrix required to properly orient
 *                          the torso of the lego protagonist
 */
MainLittleHelpersGameplayScene.prototype.generateLegoProtagonistTorsoMatrix = function () {
	var transformationMatrix = null;	

	// The torso model is centered at the origin, facing forward, upon loading. Rotate the
	// torso (90°) such that it is oriented appropriately for a character traveling along the
	// X-axis.
	var constTorsoRotationRadAxisY = Math.PI / 2.0;

	var transformationMatrix = MathUtility.generateRotationMatrix3dAxisY(constTorsoRotationRadAxisY);
	
	return transformationMatrix;	
}

/**
 * Returns the transformation matrix required to position an arm
 *  of the lego protagonist, assuming that the torso of the lego
 *  protagonist is centered at the render-space origin
 *
 * @param mirrorOrientation {Boolean} When set to true, the rotation angle will
 *                                    be negated in order to permit the proper
 *                                    opposing arm rotation representation
 * @param targetArmKey {String} Key that references the appropriate arm model
 *                              within the model key-value store
 *
 * @return {MathExt.Matrix} Transformation matrix required to properly position an arm
 *                          of the lego protagonist relative to an origin-centered torso
 */
MainLittleHelpersGameplayScene.prototype.generateLegoProtagonistArmMatrix = function (mirrorOrientation, targetArmKey) {
	var transformationMatrix = null;	

	// The arm model is centered at the origin, oriented in a direction appropriate
	// for a character traveling along the X-axis. However, the arm must be pivoted
	// at the shoulder, which first involves translating the arm such that the shoulder
	// socket is situated at the X-Y origin.
	if (Utility.validateVar(targetArmKey)) {
		// Permit the transformation to be applicable to an arm on either side of the torso...
		var mirrorMultiplier = (Utility.validateVar(mirrorOrientation) && mirrorOrientation) ? -1.0 : 1.0;

		// Determine the translation required to center the shoulder socket at the origin.
		var pivotRefDisplacementCoeffX = 0.275;
		var pivotRefDisplacementCoeffY = 0.33;
		var displacementCoeffZ = 1.70 * mirrorMultiplier;
		
		var leftArmDimensionX =
			this.modelRefDimensionKeyValStore[targetArmKey].dimensionX;
		var leftArmDimensionY =
			this.modelRefDimensionKeyValStore[targetArmKey].dimensionY;

		var leftArmPivotRefDisplacementX = leftArmDimensionX * pivotRefDisplacementCoeffX;
		var leftArmPivotRefDisplacementY = -leftArmDimensionY * pivotRefDisplacementCoeffY;
		var leftArmDisplacementZ =
			(this.modelRefDimensionKeyValStore[globalResources.keyModelLegoProtagonistTorso].dimensionZ / 2.0) *
			displacementCoeffZ;

		// Determine the current amount of arm rotation to apply.
		var rotationAngleAxisZ = this.currentLegoProtagonistArmRotationAngle() * mirrorMultiplier;
		var rotationMatrix = MathUtility.generateRotationMatrix3dAxisZ(rotationAngleAxisZ);	
		var translationMatrix = MathUtility.generateTranslationMatrix3d(leftArmPivotRefDisplacementX,
			leftArmPivotRefDisplacementY, leftArmDisplacementZ);
			
		// The arm does not require re-positioning after the rotation, as the shoulder
		// socket of the torso model is approximately situated at the origin upon loading.
		transformationMatrix = rotationMatrix.multiply(translationMatrix);
	}

	return transformationMatrix;
}

/**
 * Returns the transformation matrix required to position the left arm
 *  of the lego protagonist, assuming that the torso of the lego
 *  protagonist is centered at the render-space origin
 *
 * @return {MathExt.Matrix} Transformation matrix required to properly position the left arm
 *                          of the lego protagonist relative to an origin-centered torso
 */
MainLittleHelpersGameplayScene.prototype.generateLegoProtagonistLeftArmMatrix = function () {
	return this.generateLegoProtagonistArmMatrix(false, globalResources.keyModelLegoProtagonistLeftArm);
}

/**
 * Returns the transformation matrix required to position the right arm
 *  of the lego protagonist, assuming that the torso of the lego
 *  protagonist is centered at the render-space origin
 *
 * @return {MathExt.Matrix} Transformation matrix required to properly position the right arm
 *                          of the lego protagonist relative to an origin-centered torso
 */
MainLittleHelpersGameplayScene.prototype.generateLegoProtagonistRightArmMatrix = function () {
	return this.generateLegoProtagonistArmMatrix(true, globalResources.keyModelLegoProtagonistRightArm);
}

/**
 * Returns the transformation matrix required to position a leg
 *  of the lego protagonist, assuming that the torso of the lego
 *  protagonist is centered at the render-space origin
 *
 * @return {MathExt.Matrix} Transformation matrix required to properly position a leg
 *                          of the lego protagonist relative to an origin-centered torso
 */
MainLittleHelpersGameplayScene.prototype.generateLegoProtagonistLegMatrix = function (mirrorOrientation,
	targetLegKey) {
	var transformationMatrix = null;
	
	if (Utility.validateVar(targetLegKey)) {
		// Permit the transformation to be applicable to a leg on either side of the torso...		
		var mirrorMultiplier = (Utility.validateVar(mirrorOrientation) && mirrorOrientation) ? -1.0 : 1.0;
		
		// The leg model is centered at the origin, facing backward, upon loading. Rotate the
	    // leg (-90°) such that it is oriented appropriately for a character traveling along the
	    // X-axis.
		var constRightLegRotationRadAxisY = (-Math.PI / 2.0);
		
		// The leg must be pivoted at the hip, which first involves translating the leg such that
		// the [femur] socket is situated at the X-Y origin.
		var pivotRefDisplacementCoeffX = 0.06;

		var hipRelativeDisplacementCoeffZ = -0.285 * mirrorMultiplier;
				
		// "X" Axis dimension is actually the original Z-Axis dimension, before rotation
		var legDimensionX =
			this.modelRefDimensionKeyValStore[targetLegKey].dimensionZ;
		var legDimensionY = 
			this.modelRefDimensionKeyValStore[targetLegKey].dimensionY;
		var legPivotRefDisplacementX = legDimensionX * pivotRefDisplacementCoeffX;
		var legPivotRefDisplacementY = legDimensionY *
			this.modelLegoProtagonistConstrCoeff.constLegPivotRefDisplacementCoeffY;
		
		// Generate the translation matrix required to translate the leg socket to
		// the origin.
		var socketToOriginTranslationMatrix = MathUtility.generateTranslationMatrix3d(legPivotRefDisplacementX,
			legPivotRefDisplacementY, 0.0);
		
		// Generate the matrix required to translate the leg, and orient it properly
		// for a character traveling along the X-axis.
		var rotationMatrixAxisY = MathUtility.generateRotationMatrix3dAxisY(constRightLegRotationRadAxisY);
		var pivotRefMatrix = socketToOriginTranslationMatrix.multiply(rotationMatrixAxisY);
		
		// Generate the leg pivot transformation matrix.
		var ambulationSwingAngleZ = this.getCurrentLegoProtagonistLegRotationAngle() * mirrorMultiplier;
		var ambulationSwingRotationMatrix = MathUtility.generateRotationMatrix3dAxisZ(ambulationSwingAngleZ);
		var pivotCenteredTransformationMatrix = ambulationSwingRotationMatrix.multiply(pivotRefMatrix);
		
		// Perform a final translation required to situate the leg socket at the
		// hip.
		var hipAttachmentTranslationY = ((this.modelRefDimensionKeyValStore[globalResources.keyModelLegoProtagonistHips].dimensionY *
			(this.modelLegoProtagonistConstrCoeff.constHipDisplacementCoeffY + this.modelLegoProtagonistConstrCoeff.constLegOriginHipRelativeDisplacementCoeffY)) +
			-(this.modelRefDimensionKeyValStore[globalResources.keyModelLegoProtagonistTorso].dimensionY / 2.0));
		var hipAttachmentTranslationZ = this.modelRefDimensionKeyValStore[globalResources.keyModelLegoProtagonistHips].dimensionZ *
			hipRelativeDisplacementCoeffZ;
		var hipAttachmentTranslationMatrixY = MathUtility.generateTranslationMatrix3d(0.0, hipAttachmentTranslationY, hipAttachmentTranslationZ);
		
		transformationMatrix = hipAttachmentTranslationMatrixY.multiply(pivotCenteredTransformationMatrix);
	}

	return transformationMatrix;
}

/**
 * Returns the transformation matrix required to position the left leg
 *  of the lego protagonist, assuming that the torso of the lego
 *  protagonist is centered at the render-space origin
 *
 * @return {MathExt.Matrix} Transformation matrix required to properly position the left leg
 *         of the lego protagonist relative to an origin-centered torso
 */
MainLittleHelpersGameplayScene.prototype.generateLegoProtagonistLeftLegMatrix = function () {	
	return this.generateLegoProtagonistLegMatrix(true, globalResources.keyModelLegoProtagonistLeftLeg);
}

/**
 * Returns the transformation matrix required to position the right leg
 *  of the lego protagonist, assuming that the torso of the lego
 *  protagonist is centered at the render-space origin
 *
 * @return {MathExt.Matrix} Transformation matrix required to properly position the right leg
 *         of the lego protagonist relative to an origin-centered torso
 */
MainLittleHelpersGameplayScene.prototype.generateLegoProtagonistRightLegMatrix = function () {
	return this.generateLegoProtagonistLegMatrix(false, globalResources.keyModelLegoProtagonistRightLeg);
}

/**
 * Generates a rotation matrix that is will be applied to the
 *  composite lego protagonist (this matrix is used to change the direction
 *  in which the lego protagonist is facing)
 *
 * @return {MathExt.Matrix} Rotation matrix applied to the composite lego
 *                          protagonist
 *
 */
MainLittleHelpersGameplayScene.prototype.generateLegoProtagonistCompositeRotationMatrix = function () {
	var rotationMatrix = null

	var zAxisRotationAngle = 0.0;
	switch (this.currentLegoProtagonistAnimationType) {		
		case this.constLegoProtagonistAnimationTypeDamageReception:
			var directionMultiplier = (this.currentLegoProtagonistStaticModelDirectionBias > 0) ? -1.0 : 1.0;
			var constMaxRotationAngle = directionMultiplier * Math.PI / 15.0;
			zAxisRotationAngle = Math.sin(this.computeLegoProtagonistAnimCompletionFraction() * Math.PI) * constMaxRotationAngle;
			break;
		default:		
			break;
	}
	
	rotationMatrix = MathUtility.generateRotationMatrix3dAxisZ(zAxisRotationAngle);
	
	return rotationMatrix;	
}

/**
 * Updates all lego protagonist component matrices, based on the
 *  immediate overall operational context (e.g. time, position, etc.).
 */
MainLittleHelpersGameplayScene.prototype.updateLegoProtagonistComponentMatrices = function () {
	
	var baseMatrixKeyValStore = {};
	
	baseMatrixKeyValStore[globalResources.keyModelLegoProtagonistHead] = this.generateLegoProtagonistHeadMatrix();
	baseMatrixKeyValStore[globalResources.keyModelLegoProtagonistHips] = this.generateLegoProtagonistHipMatrix();
	baseMatrixKeyValStore[globalResources.keyModelLegoProtagonistTorso] = this.generateLegoProtagonistTorsoMatrix();
	baseMatrixKeyValStore[globalResources.keyModelLegoProtagonistLeftArm] = this.generateLegoProtagonistLeftArmMatrix();
	baseMatrixKeyValStore[globalResources.keyModelLegoProtagonistRightArm] = this.generateLegoProtagonistRightArmMatrix();
	baseMatrixKeyValStore[globalResources.keyModelLegoProtagonistLeftLeg] = this.generateLegoProtagonistLeftLegMatrix();
	baseMatrixKeyValStore[globalResources.keyModelLegoProtagonistRightLeg] = this.generateLegoProtagonistRightLegMatrix();
	
	for (var currentKey in baseMatrixKeyValStore) {
		
		var additionalTranslationVector = this.modelAdditionalDisplacementKeyValStore[currentKey];
		var additionalTranslationMatrix = MathUtility.generateTranslationMatrix3d(
			additionalTranslationVector.xComponent, additionalTranslationVector.yComponent, additionalTranslationVector.zComponent);
	
		var modelTranslationMatrix = baseMatrixKeyValStore[currentKey].multiply(additionalTranslationMatrix);
		this.modelMatrixKeyValStore[currentKey] = modelTranslationMatrix;
	}	
}

/** 
 * Generates a positioning matrix that will be applied to the composite lego
 *  protagonist - this matrix is used to properly place the lego
 *  protagonist within screen render space.
 *
 * @return {MathExt.Matrix} A positioning matrix used to properly position
 *                          the lego protagonist
 */
MainLittleHelpersGameplayScene.prototype.generateLegoProtagonistCompositeFinalPositioningMatrix = function () {	
	var finalPositioningMatrix = null;

	var rotationMatrix = this.generateLegoProtagonistCompositeRotationMatrix();

	var renderSpacePosition = this.worldSpacePositionToTranslatedRenderSpacePosition(
		this.currentLegoProtagonistWorldSpacePosition.xCoord,
		this.currentLegoProtagonistWorldSpacePosition.yCoord,
		this.currentLegoProtagonistWorldSpacePosition.zCoord);

	var renderSpaceTranslationMatrix = MathUtility.generateTranslationMatrix3d(
		renderSpacePosition.xCoord, renderSpacePosition.yCoord, renderSpacePosition.zCoord);
		
	var compositeTransfomrationMatrix = renderSpaceTranslationMatrix.multiply(rotationMatrix)
		
	if (this.getCurrentLegoProtagonistModelDirectionBias() < 0) {
		var constDirectionReverseRotationMatrix = MathUtility.generateRotationMatrix3dAxisY(Math.PI);
		finalPositioningMatrix = compositeTransfomrationMatrix.multiply(constDirectionReverseRotationMatrix);
	}
	else {
		finalPositioningMatrix = compositeTransfomrationMatrix;
	}

	return finalPositioningMatrix;
}

/**
 * Retrieves the defining attributes for a level tile situated at the
 *  specified translated render-space position
 *
 * @param translatedRenderSpacePosition {Point3d} Translated render space position in
 *                                                three-dimensional space
 *
 * @return {Object} Attributes associated with the represented
 *                  tile
 */
MainLittleHelpersGameplayScene.prototype.getTileAttributesForTileAtTranslatedRenderPosition = function (translatedRenderSpacePosition) {
	var tileAttributes = null;
	
	if (Utility.validateVarAgainstType(translatedRenderSpacePosition, Point3d)) {
		var tileColumnIndex = this.currentLevelRepresentation.getTileColumnIndexForLevelSpaceCoordX(
			translatedRenderSpacePosition.xCoord, -this.currentPositionInLevel.getX());	
		var tileRowIndex = this.currentLevelRepresentation.getTileRowIndexForLevelSpaceCoordY(
			translatedRenderSpacePosition.yCoord, -this.currentPositionInLevel.getY());

		tileAttributes = this.currentLevelRepresentation.getTileAttributesForTileAtPosition(tileRowIndex, tileColumnIndex);
	}

	return tileAttributes;
}

/**
 * Retrieves the defining attributes for a level tile situated at the
 *  specified bottom point of a translated render-space bounding box
 *
 * @param translatedRenderSpacePosition {Rectangle} Translated render-space bounding box
 *
 * @return {Object} Attributes associated with the represented
 *                  tile
 */
MainLittleHelpersGameplayScene.prototype.getTileAttributesForTileAtTranslatedRenderBoundsBottom = function (boundingRect) {
	var tileAttributes = null;
	
	if (Utility.validateVarAgainstType(boundingRect, Rectangle)) {
		var centerX = boundingRect.left + (boundingRect.getWidth() / 2.0);
		var bottomY = boundingRect.top - boundingRect.getHeight();
		
		tileAttributes = this.getTileAttributesForTileAtTranslatedRenderPosition(new Point3d(centerX, bottomY, 0.0));
	}
	
	return tileAttributes;
}

/**
 * Retrieves a tile rectangle for a level tile situated at the
 *  specified translated render-space position
 *
 * @param translatedRenderSpacePosition {Point3d} Translated render space position in
 *                                                three-dimensional space
 *
 * @return {Rectangle} Rectangle of the tile within the X-Y axis
 *
 */
MainLittleHelpersGameplayScene.prototype.getTileRectForTileAtTranslatedRenderPosition = function (translatedRenderSpacePosition) {
	var tileRect = null;

	if (Utility.validateVarAgainstType(translatedRenderSpacePosition, Point3d)) {	
		var tileColumnIndex = this.currentLevelRepresentation.getTileColumnIndexForLevelSpaceCoordX(
			translatedRenderSpacePosition.xCoord, -this.currentPositionInLevel.getX());	
		var tileRowIndex = this.currentLevelRepresentation.getTileRowIndexForLevelSpaceCoordY(
			translatedRenderSpacePosition.yCoord, -this.currentPositionInLevel.getY());
		var levelPositionX = this.currentPositionInLevel.getX();
		var levelPositionY = this.currentPositionInLevel.getY();
		tileRect = this.currentLevelRepresentation.getTileRectInLevelSpace(tileRowIndex, tileColumnIndex,
			-levelPositionX, -levelPositionY);
	}
	
	return tileRect;
}

/**
 * Determines if the lowest point of the lego protagonist model is in contact with
 *  a horizontal level surface, based on the immediate position of the lego
 *  protagonist model in world space
 *  
 * @return {boolean} True if the model is in contact with a horizontal level
 *                   surface
 */
MainLittleHelpersGameplayScene.prototype.isLegoProtagonistInContactWithHorizSurface = function () {
	var protagonistHasHorizSurfaceContact = false;

	var translatedRenderSpacePosition = this.worldSpacePositionToTranslatedRenderSpacePosition(
		this.currentLegoProtagonistWorldSpacePosition.xCoord,
		this.currentLegoProtagonistWorldSpacePosition.yCoord,
		this.currentLegoProtagonistWorldSpacePosition.zCoord);
	var legoProtagonistRenderSpaceMinPointY = translatedRenderSpacePosition.yCoord +
		this.legoProtagonistOrigRefCompositeModelMinY();
	var legoProtagonistRenderSpaceMinPointPosition = new Point3d(
		translatedRenderSpacePosition.xCoord,
		legoProtagonistRenderSpaceMinPointY,
		translatedRenderSpacePosition.zCoord);

	var tileAttributes = this.getTileAttributesForTileAtTranslatedRenderPosition(legoProtagonistRenderSpaceMinPointPosition);
	
	if (!this.isEmptySpaceLevelTileType(tileAttributes)) {
		var tileRect = this.getTileRectForTileAtTranslatedRenderPosition(legoProtagonistRenderSpaceMinPointPosition);

		protagonistHasHorizSurfaceContact =
			Math.abs(tileRect.top - (translatedRenderSpacePosition.yCoord + this.legoProtagonistOrigRefCompositeModelMinY())) <=
				this.constNumberEpsilon;
	}
	
	return protagonistHasHorizSurfaceContact;
}

/**
 * Retrieves the assigned, approximate coefficient of friction for a level
 *  tile coincident with the bottom of the translated, render-space bounding
 *  box of the lego protagonist, as applicable
 *
 * @return {Number} A coefficient of friction value (1.0 if the value could
 *                  not be determined)
 */
MainLittleHelpersGameplayScene.prototype.getFrictionCoefficientForLegoProtagonistSurface = function () {
	var frictionCoefficient = 1.0;

	var legoProtagonistBoundingBox = this.getLegoProtagonistApproxTranslatedRenderSpaceBoundingBox();
	if (legoProtagonistBoundingBox !== null) {
		var tileAttributes = this.getTileAttributesForTileAtTranslatedRenderBoundsBottom(legoProtagonistBoundingBox);
		if (!this.isEmptySpaceLevelTileType(tileAttributes) && (typeof tileAttributes.frictionCoefficient === "number")) {
			frictionCoefficient = tileAttributes.frictionCoefficient;
		}
	}
	
	return frictionCoefficient;
}

/**
 * Attempts to evaluate a surface collision for the lego protagonist along the Y-axis.
 *  A surface collision results in the following modification to the immediate
 *  lego protagonist position attributes:
 *  - Actor velocity is set to 0.0
 *  - The world-space position of the lego protagonist is altered,
 *    the that the surface along which the collision was evaluated
 *    is roughly coindident with the appropriate minimum/maximum
 *    bounding cube point of the lego protagonist.
 */
MainLittleHelpersGameplayScene.prototype.evaluateLegoProtagonistHorizontalSurfaceCollisionWithOffset = function (renderSpaceRefOffsetY,
	useTileTopSurface) {
	var translatedRenderSpacePosition = this.worldSpacePositionToTranslatedRenderSpacePosition(
		this.currentLegoProtagonistWorldSpacePosition.xCoord,
		this.currentLegoProtagonistWorldSpacePosition.yCoord,
		this.currentLegoProtagonistWorldSpacePosition.zCoord);
	
	var tileColumnIndex = this.currentLevelRepresentation.getTileColumnIndexForLevelSpaceCoordX(translatedRenderSpacePosition.xCoord,
		-this.currentPositionInLevel.getX());
	var tileRowIndex = this.currentLevelRepresentation.getTileRowIndexForLevelSpaceCoordY(
		translatedRenderSpacePosition.yCoord + renderSpaceRefOffsetY,
		-this.currentPositionInLevel.getY());

	var tileAttributes = this.currentLevelRepresentation.getTileAttributesForTileAtPosition(tileRowIndex, tileColumnIndex);	

	if (!this.isEmptySpaceLevelTileType(tileAttributes)) {	
		var levelPositionX = this.currentPositionInLevel.getX();
		var levelPositionY = this.currentPositionInLevel.getY();
		var tileRect = this.currentLevelRepresentation.getTileRectInLevelSpace(tileRowIndex, tileColumnIndex,
			-levelPositionX, -levelPositionY);
		var tileReferenceSurfaceY = useTileTopSurface ? tileRect.top : (tileRect.top - tileRect.getHeight());
		this.currentLegoProtagonistWorldSpacePosition.yCoord = this.translatedRenderSpaceLengthToWorldSpaceLengthY(
			tileReferenceSurfaceY - renderSpaceRefOffsetY) - this.constNumberEpsilon;
		this.currentLegoProtagonistVelocity.yComponent = 0;
	}		
}

/**
 * Evaluates surface collisions for the lego protagonist at the top of the
 *  lego protagonist bounding box
 */
MainLittleHelpersGameplayScene.prototype.evaluateLegoProtagonistHorizontalSurfaceCollisionUp = function () {
	this.evaluateLegoProtagonistHorizontalSurfaceCollisionWithOffset(this.legoProtagonistOrigRefCompositeModelMaxY(), false);
}

/**
 * Evaluates surface collisions for the lego protagonist at the bottom of
 *  the lego protagonist bounding box
 *
 */
MainLittleHelpersGameplayScene.prototype.evaluateLegoProtagonistHorizontalSurfaceCollisionDown = function () {
	this.evaluateLegoProtagonistHorizontalSurfaceCollisionWithOffset(this.legoProtagonistOrigRefCompositeModelMinY(), true);
}

/**
 * Attempts to evaluate a surface collision for the lego protagonist along the X-axis.
 *  lego protagonist position attributes:
 *  - Actor velocity is set to 0.0
 *  - The world-space position of the lego protagonist is altered,
 *    the that the surface along which the collision was evaluated
 *    is roughly coindident with the appropriate minimum/maximum
 *    bounding cube point of the lego protagonist.
 */
MainLittleHelpersGameplayScene.prototype.evaluateLegoProtagonistVerticalSurfaceCollision = function () {	
	var leadingEdgeOffset = 0.0;
	
	if (this.currentLegoProtagonistVelocity.xComponent > 0) {
		leadingEdgeOffset = (this.getCurrentLegoProtagonistModelDirectionBias() > 0) ?
			this.legoProtagonistOrigRefCompositeModelMaxX() :
			(-1.0 * this.legoProtagonistOrigRefCompositeModelMinX());
	}
	else if (this.currentLegoProtagonistVelocity.xComponent < 0) {
		leadingEdgeOffset = (this.getCurrentLegoProtagonistModelDirectionBias() > 0) ?
			this.legoProtagonistOrigRefCompositeModelMinX() :
			(-1.0 * this.legoProtagonistOrigRefCompositeModelMaxX());
	}
	
	var worldSpaceLeadingEdgeOffset = this.renderSpaceLengthToWorldSpaceLength(leadingEdgeOffset);
	var leadingEdgeCoordX = worldSpaceLeadingEdgeOffset + this.currentLegoProtagonistWorldSpacePosition.xCoord;
	var translatedRenderSpacePosition = this.worldSpacePositionToTranslatedRenderSpacePosition(
		leadingEdgeCoordX,
		this.currentLegoProtagonistWorldSpacePosition.yCoord,
		this.currentLegoProtagonistWorldSpacePosition.zCoord);
		
	var tileColumnIndex = this.currentLevelRepresentation.getTileColumnIndexForLevelSpaceCoordX(
		translatedRenderSpacePosition.xCoord,
		-this.currentPositionInLevel.getX());
		
	var tileTopRowIndex = this.currentLevelRepresentation.getTileRowIndexForLevelSpaceCoordY(
		translatedRenderSpacePosition.yCoord + this.legoProtagonistOrigRefCompositeModelMaxY(),
		-this.currentPositionInLevel.getY());
		
	var tileBottomRowIndex = this.currentLevelRepresentation.getTileRowIndexForLevelSpaceCoordY(
		translatedRenderSpacePosition.yCoord + this.legoProtagonistOrigRefCompositeModelMinY(),
		-this.currentPositionInLevel.getY());	


	var collisionExists = false;
	var currentTileRowIndex = tileBottomRowIndex + 1;
	
	var levelPositionX = this.currentPositionInLevel.getX();
	var levelPositionY = this.currentPositionInLevel.getY();	
	while (!collisionExists && (currentTileRowIndex < tileTopRowIndex)) {
		
		var tileAttributes = this.currentLevelRepresentation.getTileAttributesForTileAtPosition(currentTileRowIndex, tileColumnIndex);	
		var collisionRect = null;
		if (!this.isEmptySpaceLevelTileType(tileAttributes)) {		
			collisionExists = true;
			collisionRect = this.currentLevelRepresentation.getTileRectInLevelSpace(currentTileRowIndex, tileColumnIndex,
				-levelPositionX, -levelPositionY);
			currentTileRowIndex++;
		}
		
		currentTileRowIndex++;
	}
	
	var protagonistCollisionCoordX = 0.0;
	if (collisionExists) {
		if (this.currentLegoProtagonistVelocity.xComponent > 0)  {
			protagonistCollisionCoordX =
				this.translatedRenderSpaceLengthToWorldSpaceLengthX(collisionRect.left) - worldSpaceLeadingEdgeOffset;
		}
		else if (this.currentLegoProtagonistVelocity.xComponent < 0) {
			protagonistCollisionCoordX =
				this.translatedRenderSpaceLengthToWorldSpaceLengthX(collisionRect.left + collisionRect.width) - worldSpaceLeadingEdgeOffset;
		}
		
		this.currentLegoProtagonistWorldSpacePosition.xCoord = protagonistCollisionCoordX;
		this.currentLegoProtagonistVelocity.xComponent = 0;
	}	
}

/**
 * Returns the sum of two number, retaining the
 *  sign bias while clamping the resultant
 *  magnitude
 *
 * @param firstScalar First value of the sum
 * @param secondScalar Second value of the sum
 * @param maxMagnitude Maximum permissible sum magnitude
 *
 * @return {Number} A sum with a proper sign bias and clamped magnitude
 */
MainLittleHelpersGameplayScene.prototype.getSumWithMagnitudeClamp = function (firstScalar, secondScalar, maxMagnitude) {
	var clampedResult = 0.0;
	
	if (Utility.validateVar(firstScalar) && Utility.validateVar(secondScalar) && Utility.validateVar(maxMagnitude)) {
		
		clampedResult = firstScalar + secondScalar;
		var signBias = (clampedResult > 0) ? 1.0 : -1.0;
		
		if (clampedResult > Math.abs(maxMagnitude)) {
			clampedResult = Math.abs(maxMagnitude) * signBias;	
		}			
	}
	
	return clampedResult;
}

/**
 * Applies deceleration to the lego protagonist in order to progressively
 *  decrease the velocity of the lego protagonist - this deceleration
 *  rate is affected by the approximate coefficient of friction
 *  of the surface on which the lego protagonist is situated
 *
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 */
MainLittleHelpersGameplayScene.prototype.applyLegoProtagonistAmbulationDeceleration = function (timeQuantum) {
	
	if (this.currentLegoProtagonistVelocity.xComponent !== 0.0) {
		var decelerationDirectionBias = (this.currentLegoProtagonistVelocity.xComponent > 0) ? -1.0 : 1.0;
		
		var frictionCoefficient = this.getFrictionCoefficientForLegoProtagonistSurface();
		this.currentLegoProtagonistVelocity.xComponent +=
			(decelerationDirectionBias * this.legoProtagonistAmbulationDecelerationMetersPerMsSq *
			frictionCoefficient * timeQuantum);
		
		if ((this.currentLegoProtagonistVelocity.xComponent * decelerationDirectionBias) > 0.0) {
			this.currentLegoProtagonistVelocity.xComponent = 0.0;
		}
	}
}

/**
 * Computes the immediate velocity of the lego protagonist along the
 *  X-axis, as a result of any acceleration being applied
 *
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 * @param accelerationAxisX {Number} Immediate acceleration being applied to the
 *                                   lego protagonist along the X-axis (m/millisecond²)
 * @param maxVelocityFromAcceleration {Number} Maximum permissible velocity that
 *                                             can be achieved through applied
 *                                             acceleration forces - acceleration
 *                                             will not be applied to if this
 *                                             velocity has been exceeded (m/millisecond²)
 */
MainLittleHelpersGameplayScene.prototype.updateLegoProtagonistVelocityAxisX = function (timeQuantum,
	accelerationAxisX, maxVelocityFromAcceleration) {
	
	// If the character has achieved a velocity greater than the maximum velocity
	// specified for the movement context for some reason, do not adjust the velocity
	// using the acceleration logic, as the resulting velocity may be improperly clamped.
	if (Math.abs(this.currentLegoProtagonistVelocity.xComponent) <= Math.abs(maxVelocityFromAcceleration)) {
		this.currentLegoProtagonistVelocity.xComponent = this.getSumWithMagnitudeClamp(
				this.currentLegoProtagonistVelocity.xComponent,
				(accelerationAxisX * timeQuantum),
				maxVelocityFromAcceleration);
	}
	else if ((this.currentLegoProtagonistVelocity.xComponent > 0.0) !== (accelerationAxisX > 0.0)) {
		// Permit the velocity to only be reduced if the horizontal velocity exceeds
		// the maximum specified velocity.
		this.currentLegoProtagonistVelocity.xComponent = this.getSumWithMagnitudeClamp(
				this.currentLegoProtagonistVelocity.xComponent,
				(accelerationAxisX * timeQuantum),
				this.currentLegoProtagonistVelocity.xComponent);
	}	
}

/**
 * Computes the immediate velocity of the lego protagonist along the
 *  X-axis, making provisions for deceleration, and generally
 *  accounting for positional context (e.g., air vs surface contact)
 *
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 */
MainLittleHelpersGameplayScene.prototype.updateLegoProtagonistVelocity = function (timeQuantum) {
	if (!this.isLegoProtagonistInContactWithHorizSurface()) {
		// Apply x-axis acceleration in order to provide a moderate amount of
		// lateral control to the lego protagonist while jumping/falling.
		this.updateLegoProtagonistVelocityAxisX(timeQuantum,
			this.currentLegoProtagonistAmbulationAccelerationAxisX * this.legoProtagonistAerialAccelerationScaleFactor,
			this.currentLegoProtagonistMaxAmbulationVelocityX);
			
		// Update the protagonist [vertical] velocity change due to gravity.
		this.currentLegoProtagonistVelocity.yComponent -= (this.constGravitationalAccelerationMetersPerMsSq *
			timeQuantum);
	}
	else {		
		var frictionCoefficient = this.getFrictionCoefficientForLegoProtagonistSurface();
		
		// Apply ambulation acceleration (with constrained velocity) to the
		// lego protagonist.
		this.updateLegoProtagonistVelocityAxisX(timeQuantum,
			this.currentLegoProtagonistAmbulationAccelerationAxisX * frictionCoefficient,
			this.currentLegoProtagonistMaxAmbulationVelocityX);

		if (this.currentLegoProtagonistAmbulationAccelerationAxisX === 0.0) {
			// Progressively slow the lego protagonist if no active movement
			// acceleration is being applied.
			this.applyLegoProtagonistAmbulationDeceleration(timeQuantum);
		}
		
		if (this.legoProtagonistJumpInitiated) {
			this.currentLegoProtagonistVelocity.yComponent = this.initialLegoProtagonistJumpVelocityMetersPerMs;
			this.legoProtagonistJumpInitiated = false;
		}
		else {
			this.currentLegoProtagonistVelocity.yComponent = 0.0;
		}
	}	
}

/**
 * Determines if the lego protagonist is in an invulnerable state
 *
 * @return True if invulnerability is immediately active
 */
MainLittleHelpersGameplayScene.prototype.isLegoProtagonistInvulnerable = function () {	
	var invulnerabilityIsActive =
		(this.totalElapsedSceneTimeMs - this.currentLegoProtagonistInvulnerabilityStartTimeMs) <=
		this.constLegoProtagonistInvulnerabilityDurationMs;
		
	return invulnerabilityIsActive;
}

/**
 * Performs all activities required after the successful determination
 *  of a positive collision between a lego protagonist and an enemy
 *
 * @param enemyInstance {EnemyInstanceData} Data which describes the enemy which
 *                                          collided with the lego protagonist
 */
MainLittleHelpersGameplayScene.prototype.processLegoProtagonistEnemyCollision = function (enemyInstance) {
	this.registerLegoProtagonistDamage(enemyInstance.contactDamage);
}

/**
 * Attempts to evaluate and process all potential collisions with
 *  between the lego protagonist and goal items contained within the
 *  level
 */
MainLittleHelpersGameplayScene.prototype.evaluateLegoProtagonistGoalCollisions = function () {
	var protagonistBoundingBox = this.getLegoProtagonistApproxTranslatedRenderSpaceBoundingBox();
	for (var currentGoalInstance of this.goalItemInstanceDataCollection) {	
		var goalBoundingBox = this.getItemTranslatedRenderSpaceBoundingBox(currentGoalInstance.modelWorldSpacePosition, 
			currentGoalInstance.modelDataKey);	
		if (currentGoalInstance.isActive && this.doRectanglesIntersect(protagonistBoundingBox, goalBoundingBox)) {
			currentGoalInstance.isActive = false;
			this.discoveredGoalItemCount++;
		}
	}	
	
}

/**
 * Attempts to evaluate and process all potential collisions with
 *  between the lego protagonist and enemy instances contained within the
 *  level
 */
MainLittleHelpersGameplayScene.prototype.evaluateLegoProtagonistEnemyCollisions = function () {	
	if (!this.isLegoProtagonistInvulnerable()) {
		var protagonistBoundingBox = this.getLegoProtagonistApproxTranslatedRenderSpaceBoundingBox();
		for (var currentEnemyInstance of this.enemyInstanceDataCollection) {
		
			var enemyBoundingBox = this.getItemTranslatedRenderSpaceBoundingBox(currentEnemyInstance.modelWorldSpacePosition, 
				currentEnemyInstance.modelDataKey);	
			if (this.doRectanglesIntersect(protagonistBoundingBox, enemyBoundingBox)) {
				this.processLegoProtagonistEnemyCollision(currentEnemyInstance);
			}
		}
	}
}

/**
 * Attempts to evaluate and process all potential collisions with
 *  between the lego protagonist all dynamic items (enemy instances/goal items)
 */
MainLittleHelpersGameplayScene.prototype.evaluateLegoProtagonistDynamicItemCollisions = function () {
	this.evaluateLegoProtagonistEnemyCollisions();
	this.evaluateLegoProtagonistGoalCollisions();
}

/**
 * Updates the "additional" displacements that are applied to each
 *  lego protagonist model component. These displacements can be used to
 *  provide conditional/ancillary displacment operations (used to generate
 *  the "game over" state dispersion animation)
 *
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 */
MainLittleHelpersGameplayScene.prototype.updateLegoProtagonistAdditionalComponentDisplacements = function (timeQuantum) {
	for (var currentKey in this.constLegoProtagonistModelBaseAdditionalDisplacements) {
		var currentDisplacement = this.constLegoProtagonistModelBaseAdditionalDisplacements[currentKey].multiplyByScalar(timeQuantum);
		var newTotalDisplacement = this.modelAdditionalDisplacementKeyValStore[currentKey].addVector(currentDisplacement);
		this.modelAdditionalDisplacementKeyValStore[currentKey] = newTotalDisplacement;
	}
}

/**
 * Performs all computations required to update the positional attributes
 *  (acceleration, velocity, world-space position) of the lego protagonist
 *
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 */
MainLittleHelpersGameplayScene.prototype.updateLegoProtagonistPositionalAttributes = function (timeQuantum) {
	// Update the protagonist position, using the current protagonist velocity.
	this.currentLegoProtagonistWorldSpacePosition.xCoord +=
		(this.currentLegoProtagonistVelocity.xComponent * timeQuantum);
	this.currentLegoProtagonistWorldSpacePosition.yCoord +=
		(this.currentLegoProtagonistVelocity.yComponent * timeQuantum);
	this.currentLegoProtagonistWorldSpacePosition.zCoord +=
		(this.currentLegoProtagonistVelocity.zComponent * timeQuantum);
		
	if (this.currentLegoProtagonistVelocity.yComponent < 0.0) {
		// Ensure that the protagonist properly comes to rest on proximal horizontal
		// surface, if applicable.
		this.evaluateLegoProtagonistHorizontalSurfaceCollisionDown();
	}
	else if (this.currentLegoProtagonistVelocity.yComponent > 0.0) {
		this.evaluateLegoProtagonistHorizontalSurfaceCollisionUp();
	}

	this.updateLegoProtagonistVelocity(timeQuantum);
	this.updateLegoProtagonistModelStaticDirectionBias();
	
	if (this.currentLegoProtagonistVelocity.xComponent !== 0.0) {
		// Ensure that the protagonist properly stops when in contact with world
		// objects.
		this.evaluateLegoProtagonistVerticalSurfaceCollision();
	}
}

/**
 * Attempts to evalaute any surface contact damage that may
 *  result from the lego protagonist being in contact with
 *  damage-inducing surface tiles
 */
MainLittleHelpersGameplayScene.prototype.evaluateLegoProtagonistSurfaceContactDamage = function () {
	
	var legoProtagonistBoundingBox = this.getLegoProtagonistApproxTranslatedRenderSpaceBoundingBox();
	if (legoProtagonistBoundingBox !== null) {
		var tileAttributes = this.getTileAttributesForTileAtTranslatedRenderBoundsBottom(legoProtagonistBoundingBox);
		if (!this.isEmptySpaceLevelTileType(tileAttributes) && (typeof tileAttributes.contactDamage === "number")) {
			this.registerLegoProtagonistDamage(tileAttributes.contactDamage);
		}
	}
}

/**
 * Applies a specified scalar damage value to the lego protagonist,
 *  as necessary
 */
MainLittleHelpersGameplayScene.prototype.registerLegoProtagonistDamage = function (damageValue) {
	if ((Utility.returnValidNumOrZero(damageValue) > 0.0) &&
		!this.isLegoProtagonistInvulnerable()) {
	
		this.currentLegoProtagonistInvulnerabilityStartTimeMs = this.totalElapsedSceneTimeMs;

		this.legoProtagonistCurrentHealth -= damageValue;
		
		this.currentLegoProtagonistAnimationType = this.constLegoProtagonistAnimationTypeDamageReception;
		this.currentLegoProtagonistAnimationStartTimeMs = this.totalElapsedSceneTimeMs;
	}
}

/**
 * Updates the "position" within the level - this position is the offset that is
 *  used to produce a scrolling effect (not the lego protagonist position), and is
 *  properly clamped to the level extents.
 */
MainLittleHelpersGameplayScene.prototype.updatePositionInLevel = function () {
	var positionInLevelX = Math.max(-this.currentLevelRepresentation.getEdgeAlignedLevelOffsetMinX(),
		this.worldSpaceLengthToRenderSpaceLength(this.currentLegoProtagonistWorldSpacePosition.xCoord));
	var positionInLevelY = Math.max(-this.currentLevelRepresentation.getEdgeAlignedLevelOffsetMinY(),
		this.worldSpaceLengthToRenderSpaceLength(this.currentLegoProtagonistWorldSpacePosition.yCoord));
		
	this.currentPositionInLevel.xCoord = Math.min(-this.currentLevelRepresentation.getEdgeAlignedLevelOffsetMaxX(),
		positionInLevelX);
	this.currentPositionInLevel.yCoord = Math.min(-this.currentLevelRepresentation.getEdgeAlignedLevelOffsetMaxY(),
		positionInLevelY);
}

/**
 * Updates various lego protagonist state information attributes (position, render state, etc.)
 *
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 */
MainLittleHelpersGameplayScene.prototype.updateStateInformationForLegoProtagonist = function (timeQuantum) {
	this.updateLegoProtagonistComponentMatrices();
	this.updateLegoProtagonistPositionalAttributes(timeQuantum);
	this.evaluateLegoProtagonistSurfaceContactDamage();
	this.updateLegoProtagonistRenderState();
}

/**
 * Specialized state update for the lego protagonist which only occurs during
 *  the "game over" state.
 *
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 */
MainLittleHelpersGameplayScene.prototype.updateGameOverStateInformationForLegoProtagonist = function(timeQuantum) {
	// Update offsets applied to individual components (these offsets are
	// applied for presentation purposes, and are not used to evaluate the
	// composite bounding box).
	this.updateLegoProtagonistAdditionalComponentDisplacements(timeQuantum);
	this.updateLegoProtagonistComponentMatrices();
}

/**
 * Determines if a rectangle in translated render space intersects
 *  a particular indexed tile column
 *
 * @param queryRect {Rectangle} Rectangle in translated render-space coordiantes
 * @param columnIndex {Number} Index of the column for which intersection is to be
 *                             determined
 *
 * @return {Boolean} True if the rectangle intersects an indexed tile column
 */
MainLittleHelpersGameplayScene.prototype.doesRectIntersectTileInColumn = function(queryRect, columnIndex) {
	var rectIntersectsTile = false;

	var levelPositionX = this.currentPositionInLevel.getX();
	var levelPositionY = this.currentPositionInLevel.getY();
	
	var currentRowIndex = 0;
	while ((currentRowIndex < this.currentLevelRepresentation.getTileGridHeight()) && !rectIntersectsTile) {
		var tileRectInLevelSpace = this.currentLevelRepresentation.getTileRectInLevelSpace(currentRowIndex, columnIndex,
			-levelPositionX, -levelPositionY);
			
		var tileAttributes = this.currentLevelRepresentation.getTileAttributesForTileAtPosition(currentRowIndex, columnIndex);
		rectIntersectsTile = !this.isEmptySpaceLevelTileType(tileAttributes) &&
			this.doRectanglesIntersect(queryRect, tileRectInLevelSpace);
		
		currentRowIndex++;
	}
				
	return rectIntersectsTile;
}

/**
 * Determines if a rectangle in translated render space intersects
 *  a particular indexed tile row
 *
 * @param queryRect {Rectangle} Rectangle in translated render-space coordiantes
 * @param columnIndex {Number} Index of the row for which intersection is to be
 *                             determined
 *
 * @return {Boolean} True if the rectangle intersects an indexed tile row
 */
MainLittleHelpersGameplayScene.prototype.doesRectIntersectTileInRow = function(queryRect, rowIndex) {
	var rectIntersectsTile = false;

	var levelPositionX = this.currentPositionInLevel.getX();
	var levelPositionY = this.currentPositionInLevel.getY();

	var currentColumnIndex = 0;
	while ((currentColumnIndex < this.currentLevelRepresentation.getTileGridWidth()) && !rectIntersectsTile) {
		var tileRectInLevelSpace = this.currentLevelRepresentation.getTileRectInLevelSpace(rowIndex, currentColumnIndex,
			-levelPositionX, -levelPositionY);
			
		var tileAttributes = this.currentLevelRepresentation.getTileAttributesForTileAtPosition(rowIndex, currentColumnIndex);
		rectIntersectsTile = !this.isEmptySpaceLevelTileType(tileAttributes) &&
			this.doRectanglesIntersect(queryRect, tileRectInLevelSpace);

		currentColumnIndex++;
	}

	return rectIntersectsTile;
}

/**
 * Determines if a time-quantum extrapolated element position will
 *  result in a collision with a static level tile along the X-axis
 *
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 * @param dynamicElement {DynamicItemInstanceData/EnemyInstanceData} Dynamic item representation for which
 *                                                                   a potential collision is to be determined
 *
 * @return {Boolean} True if a collision will occur
 */
MainLittleHelpersGameplayScene.prototype.isCollisionImminentForDynamicElementAxisX = function(timeQuantum, dynamicElement) {
	var collisionIsImminent = false;
	
	var originalRenderSpaceBounds = this.getItemTranslatedRenderSpaceBoundingBox(dynamicElement.modelWorldSpacePosition,
		dynamicElement.modelDataKey);
	var extrapolatedRenderSpacePosition = new Point3d(
		dynamicElement.modelWorldSpacePosition.xCoord + (dynamicElement.velocityVector.xComponent * timeQuantum),
		dynamicElement.modelWorldSpacePosition.yCoord + (dynamicElement.velocityVector.yComponent * timeQuantum),
		dynamicElement.modelWorldSpacePosition.zCoord + (dynamicElement.velocityVector.zComponent * timeQuantum));
	var extrapolatedRenderSpaceBounds = this.getItemTranslatedRenderSpaceBoundingBox(extrapolatedRenderSpacePosition,
		dynamicElement.modelDataKey);

	var originalEdgeX = 0.0
	var extrapolatedEdgeX = 0.0;
	if (dynamicElement.velocityVector.xComponent > 0) {
		originalEdgeX = originalRenderSpaceBounds.left + originalRenderSpaceBounds.getWidth();
		extrapolatedEdgeX = extrapolatedRenderSpaceBounds.left + extrapolatedRenderSpaceBounds.getWidth();
	}
	else {
		originalEdgeX = originalRenderSpaceBounds.left;
		extrapolatedEdgeX = extrapolatedRenderSpaceBounds.left;
	}

	var tileColumnForOriginalEdge = this.currentLevelRepresentation.getTileColumnIndexForLevelSpaceCoordX(originalEdgeX, -this.currentPositionInLevel.getX());	
	var tileColumnForExtrapolatedEdge = this.currentLevelRepresentation.getTileColumnIndexForLevelSpaceCoordX(extrapolatedEdgeX, -this.currentPositionInLevel.getX());

	if (tileColumnForOriginalEdge !== tileColumnForExtrapolatedEdge) {
		collisionIsImminent = (!this.doesRectIntersectTileInColumn(originalRenderSpaceBounds, tileColumnForOriginalEdge) &&
			this.doesRectIntersectTileInColumn(extrapolatedRenderSpaceBounds, tileColumnForExtrapolatedEdge));
	}
	
	return collisionIsImminent;
}

/**
 * Determines if a time-quantum extrapolated element position will
 *  result in a collision with a static level tile along the Y-axis
 *
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 * @param dynamicElement {DynamicItemInstanceData/EnemyInstanceData} Dynamic item representation for which
 *                                                                   a potential collision is to be determined
 *
 * @return {Boolean} True if a collision will occur
 */
MainLittleHelpersGameplayScene.prototype.isCollisionImminentForDynamicElementAxisY = function(timeQuantum, dynamicElement) {
	var collisionIsImminent = false;	
	
	var originalRenderSpaceBounds = this.getItemTranslatedRenderSpaceBoundingBox(dynamicElement.modelWorldSpacePosition,
		dynamicElement.modelDataKey);
	var extrapolatedRenderSpacePosition = new Point3d(
		dynamicElement.modelWorldSpacePosition.xCoord + (dynamicElement.velocityVector.xComponent * timeQuantum),
		dynamicElement.modelWorldSpacePosition.yCoord + (dynamicElement.velocityVector.yComponent * timeQuantum),
		dynamicElement.modelWorldSpacePosition.zCoord + (dynamicElement.velocityVector.zComponent * timeQuantum));
	var extrapolatedRenderSpaceBounds = this.getItemTranslatedRenderSpaceBoundingBox(extrapolatedRenderSpacePosition,
		dynamicElement.modelDataKey);
		
	var originalEdgeY = 0.0
	var extrapolatedEdgeY = 0.0;
	if (dynamicElement.velocityVector.yComponent > 0) {
		originalEdgeY = originalRenderSpaceBounds.top;
		extrapolatedEdgeY = extrapolatedRenderSpaceBounds.top;
	}
	else {
		originalEdgeY = originalRenderSpaceBounds.top - originalRenderSpaceBounds.getHeight();
		extrapolatedEdgeY = extrapolatedRenderSpaceBounds.top - extrapolatedRenderSpaceBounds.getHeight();
	}
	
	var tileRowForOriginalEdge = this.currentLevelRepresentation.getTileRowIndexForLevelSpaceCoordY(originalEdgeY, -this.currentPositionInLevel.getY());	
	var tileRowForExtrapolatedEdge = this.currentLevelRepresentation.getTileRowIndexForLevelSpaceCoordY(extrapolatedEdgeY, -this.currentPositionInLevel.getY());

	if (tileRowForOriginalEdge !== tileRowForExtrapolatedEdge) {
		collisionIsImminent = (!this.doesRectIntersectTileInRow(originalRenderSpaceBounds, tileRowForOriginalEdge) &&
			this.doesRectIntersectTileInRow(extrapolatedRenderSpaceBounds, tileRowForExtrapolatedEdge));
	}	
		
	return collisionIsImminent;
}

/**
 * Attempts to determine if any collisions will occur imminently between
 *  dynamic level items and static level tiles
 *
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 * @param elementCollection {Array} Array of DynamicItemInstanceData/EnemyInstanceData for
 *                                  which collisions will be evaluated
 *
 */
MainLittleHelpersGameplayScene.prototype.processPendingCollisionsForDynamicElements = function (timeQuantum, elementCollection) {
	if (Utility.validateVar(timeQuantum) && Utility.validateVar(elementCollection)) {
		for (var currentElement of elementCollection) {
			if (currentElement.isActive) {
				if (this.isCollisionImminentForDynamicElementAxisX(timeQuantum, currentElement)) {
					currentElement.velocityVector.xComponent *= -1.0;
				}
				
				if (this.isCollisionImminentForDynamicElementAxisY(timeQuantum, currentElement)) {
					currentElement.velocityVector.yComponent *= -1.0;					
				}
			}
		}
	}		
}

/**
 * Upates the positions of all dynamic elements, using the associated velocity for
 *  each element
 *
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 * @param elementCollection {Array} Array of DynamicItemInstanceData/EnemyInstanceData for
 *                                  which positions will be evaluated
 *
 */
MainLittleHelpersGameplayScene.prototype.updatePositionForDynamicElements = function (timeQuantum, elementCollection) {
	if (Utility.validateVar(timeQuantum) && Utility.validateVar(elementCollection)) {
		for (var currentElement of elementCollection) {
			if (currentElement.isActive) {
				currentElement.modelWorldSpacePosition.xCoord +=
					(currentElement.velocityVector.xComponent * timeQuantum);
				currentElement.modelWorldSpacePosition.yCoord +=
					(currentElement.velocityVector.yComponent * timeQuantum);
			}
		}			
	}	
}

/**
 * Updates state information for all dynamic elements (collision handling, position, etc.)
 *
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 */
MainLittleHelpersGameplayScene.prototype.updateStateInformationForDynamicElements = function (timeQuantum) {
	if (this.isInActiveOperationState()) {	
		this.processPendingCollisionsForDynamicElements(timeQuantum, this.enemyInstanceDataCollection);
		this.updatePositionForDynamicElements(timeQuantum, this.enemyInstanceDataCollection);
	}
}

/**
 * Updates state information for all world objects (enemy items/dynamic items, lego protagonist)
 *
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 */
MainLittleHelpersGameplayScene.prototype.updateStateInformationForWorldObjects = function (timeQuantum) {
	if (this.isInActiveOperationState()) {
		this.updateStateInformationForLegoProtagonist(timeQuantum);
		this.updateStateInformationForDynamicElements(timeQuantum);
		this.updateActorAnimationStates();
	}
	else if (this.isInGameOverState()) {
		this.updateGameOverStateInformationForLegoProtagonist(timeQuantum);
	}
}

/**
 * Updates the state information for static world elements
 *
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 */
MainLittleHelpersGameplayScene.prototype.updateStateInformationForWorld = function (timeQuantum) {
	this.updatePositionInLevel();
}

/**
 * Determines if a tile is considered to be an "empty space" tile - an empty
 *  space tile is a tile for which no collision events are computed and no
 *  rendering activities will occur
 * 
 * @param tileType {Object} Object that contains the tile attributes
 *
 * @return True if the tile is an empty space tile
 */
MainLittleHelpersGameplayScene.prototype.isEmptySpaceLevelTileType = function (tileType) {	
	var isEmptySpaceTileType = true;

	if (Utility.validateVar(tileType)) {
		var isEmptySpaceTileType =
			(typeof tileType.representsEmptySpace !== "undefined") || tileType.representsEmptySpace;
	}
	
	return isEmptySpaceTileType;
}

/**
 * Determines if a tile should be rendered
 * 
 * @param tileType {Object} Object that contains the tile attributes
 *
 * @return True if the tile should be rendered
 */
MainLittleHelpersGameplayScene.prototype.shouldTileTypeBeRendered = function(tileType) {
	var shouldTileTypeBeRendered = false;
	
	if (Utility.validateVar(tileType)) {		
		shouldTileTypeBeRendered = !this.isEmptySpaceLevelTileType(tileType);
	}
	
	return shouldTileTypeBeRendered;
}

/**
 * Determines if two rectangles intersect
 *
 * @param firstRect {Rectangle} First rectangle for the intersection test
 * @param secondRect {Rectangle} Second rectangle for the intersection test
 *
 * @return True if the rectangle intersect
 */
MainLittleHelpersGameplayScene.prototype.doRectanglesIntersect = function (firstRect, secondRect) {
	var rectanglesIntersect = false;
	
	if (Utility.validateVarAgainstType(firstRect, Rectangle) && Utility.validateVarAgainstType(secondRect, Rectangle)) {
		var vertIntersectionExists = ((firstRect.top >= secondRect.top) && ((firstRect.top - firstRect.getHeight()) <= secondRect.top)) ||
			((secondRect.top > firstRect.top) && ((secondRect.top - secondRect.getHeight()) < firstRect.top));
			
		var horizIntersectionExists = ((firstRect.left <= secondRect.left) && ((firstRect.left + firstRect.getWidth()) >= secondRect.left)) ||
			((secondRect.left <= firstRect.left) && ((secondRect.left + secondRect.getWidth()) >= firstRect.left));
		
		rectanglesIntersect = vertIntersectionExists && horizIntersectionExists;
	}	

	return rectanglesIntersect;
}

/**
 * Returns the expected attribute location specifiers (as required for use with
 *  WebGLRenderingContext.getAttribLocation()) used with all employed shaders
 *
 * @param useTextures {Boolean} Indicates whether or not the associated shader
 *                              is expected to use textures
 *
 * @return {WebGlUtility.AttributeLocationData()} A collection of expected attribute
 *                                                location specifiers
 */
MainLittleHelpersGameplayScene.prototype.getStandardShaderWebGlAttributeLocations = function(useTextures) {
	var attributeLocationData = new WebGlUtility.AttributeLocationData();
	attributeLocationData.vertexPositionAttributeLocation = "aVertexPosition";
	attributeLocationData.vertexColorAttributeLocation = "aVertexColor";
	attributeLocationData.vertexNormalAttributeLocation = "aVertexNormal";
	attributeLocationData.ambientLightVectorAttributeLocation = "uniform_ambientLightVector";
	
	if (Utility.validateVar(useTextures) && useTextures) {
		attributeLocationData.textureCoordinateAttributeLocation = "aTextureCoord";
	}
	else {
		attributeLocationData.textureCoordinateAttributeLocation = null;		
	}
	
	attributeLocationData.transformationMatrixAttributeLocation = "uniform_transformationMatrix";
	
	return attributeLocationData;
}

/**
 * Returns a collection of constants that represent default values
 *  (sizes, etc.) pertaining to the storage of WebGL data, or general
 *  operational values
 *
 * @return {WebGlUtility.AttributeData()} A collection of constants pertaining to the
 *                                        storage of WebGL data/rendering behavior
 */
MainLittleHelpersGameplayScene.prototype.getDefaultWebGlAttributeData = function() {
	var attributeData = new WebGlUtility.AttributeData();
	
	attributeData.vertexDataSize = this.constVertexSize;
	attributeData.vertexColorSize = this.constVertexColorSize;
	attributeData.vectorSize = this.constVectorSize;
	attributeData.ambientLightVector = this.constAmbientLightVector;
	attributeData.textureCoordinateSize = this.constTextureCoordinateSize;
						
	return attributeData;
}

/**
 * Updates the internal timer employed to maintain the overlay refresh interval
 *
 * @param timeQuantum Time delta with respect to the previously-executed
 *                    animation step (milliseconds)
 */
MainLittleHelpersGameplayScene.prototype.updateOverlayRefreshInterval = function(timeQuantum) {
	if (this.currentOverlayUpdateElapsedInterval < this.constOverlayUpdateIntervalMs) {
		this.currentOverlayUpdateElapsedInterval += timeQuantum;
	}
	else {
		this.currentOverlayUpdateElapsedInterval = 0;
	}
}

/**
 * Determines if overlay data should be updated, based upon internal factors
 *  (e.g. current overlay time counter)
 */
MainLittleHelpersGameplayScene.prototype.shouldUpdateOverlay = function() {
	return this.currentOverlayUpdateElapsedInterval >= this.constOverlayUpdateIntervalMs;
}

/**
 * Updates the game goal status canvas/bitmap
 */
MainLittleHelpersGameplayScene.prototype.updateGameGoalText = function() {
	var gameGoalStatusString =
		Constants.stringGoalStatusLabel + this.discoveredGoalItemCount + Constants.stringGoalCountSeparator + this.goalItemInstanceDataCollection.length;
	
	this.goalStatusTextCanvasBuffer.updateStaticTextString(gameGoalStatusString);
}

/**
 * Renders a representation of the immediate spirit gauge level into
 *  the provided canvas context
 *
 * @param targetCanvasContext {CanvasRenderingContext2D}  Canvas into which the spirit gauge will
 *                                                        be rendered
 * @param spiritGaugeWidth {Number} The width of the spirit gauge
 * @param spiritGaugeHeight {Number} The height of the spirit gauge
 * @param spiritGaugeOffsetX {Nubmer} The gauge offset from the left edge of the screen
 */
MainLittleHelpersGameplayScene.prototype.updateSpiritGaugeMagnitudeRepresentation = function (targetCanvasContext,
																							  spiritGaugeWidth,
																							  spiritGaugeHeight,
																							  spiritGaugeOffsetX) {

	if (Utility.validateVar(targetCanvasContext) && Utility.validateVar(spiritGaugeWidth) &&
		Utility.validateVar(spiritGaugeHeight) && Utility.validateVar(spiritGaugeOffsetX)) {

		var spiritGaugeBorderSizeX = 5;
		var spiritGaugeBorderSizeY = 4;
		
		var gaugeSegmentSpacing = 3;
		var gaugeSegmentWidth = 7;

		// Erase the existing spirit gauge rendering.
		targetCanvasContext.fillStyle = this.constCanvasClearColor.getRgbaIntValueAsStandardString();
		targetCanvasContext.fillRect(spiritGaugeOffsetX + this.constOverlayTextLeftMargin, 0, spiritGaugeWidth,
			spiritGaugeHeight);
			
		targetCanvasContext.strokeStyle = this.constSpiritGaugeOutlineColor.getRgbaIntValueAsStandardString();
		targetCanvasContext.strokeRect(spiritGaugeOffsetX + this.constOverlayTextLeftMargin, 0, spiritGaugeWidth,
			spiritGaugeHeight);

		spiritValueForGaugeDisplay = Math.max(Math.min(this.legoProtagonistCurrentHealth, this.constLegoProtagonistMaxHealth),
			this.constLegoProtagonistMinHealth);
		var spiritValueFraction = (spiritValueForGaugeDisplay - this.constLegoProtagonistMinHealth) /
			(this.constLegoProtagonistMaxHealth - this.constLegoProtagonistMinHealth);

		var innerGaugeLeftCoord = spiritGaugeOffsetX + this.constOverlayTextLeftMargin + spiritGaugeBorderSizeX +
			Math.floor(gaugeSegmentSpacing / 2.0);
		var innerGaugeMaxWidth = spiritGaugeWidth - (2 * spiritGaugeBorderSizeX);
		var innerGaugeWidth = Math.max(0.0, (Math.floor((spiritGaugeWidth - (2 * spiritGaugeBorderSizeX)) * spiritValueFraction)));
		
		var gaugeSegmentCount = Math.ceil(innerGaugeWidth / (gaugeSegmentSpacing + gaugeSegmentWidth));
		var maxGaugeSegmentCount = Math.ceil(innerGaugeMaxWidth / (gaugeSegmentSpacing + gaugeSegmentWidth));
		
		for (var currentSegmentIndex = 0; currentSegmentIndex < gaugeSegmentCount; currentSegmentIndex++) {
			var colorWeight = Math.pow(currentSegmentIndex / (maxGaugeSegmentCount - 1), 0.5);
			var gaugeColor = this.constSpiritGaugeMinValueColor.blendWithUnitWeight(this.constSpiritGaugeMaxValueColor,
				colorWeight);
			targetCanvasContext.fillStyle = gaugeColor.getRgbaIntValueAsStandardString();
			var segmentLeadingEdgeX = innerGaugeLeftCoord + ((gaugeSegmentSpacing + gaugeSegmentWidth) * currentSegmentIndex);
			targetCanvasContext.fillRect(segmentLeadingEdgeX, spiritGaugeBorderSizeY, gaugeSegmentWidth,
				spiritGaugeHeight - (2 * spiritGaugeBorderSizeY));
		}
	}
}

/**
 * Determines the immediate completion fraction of an
 *  active "fade to black" transition
 *
 * @return {Number} Fade to black transition completion fraction
 *                  (0.0 if no transition is in progress)
 */
MainLittleHelpersGameplayScene.prototype.getBlackFadeFraction = function () {
	var blackFadeFraction = 0.0;
	
	var fadeCompletionFraction = 0.0;	
	if (this.fadeTransitionStatus !== this.constFadeTransitionStatusNone) {
		fadeCompletionFraction =
			Math.min(1.0, (this.totalElapsedSceneTimeMs - this.fadeTransitionStartTimeMs) / 
			this.constFadeDurationMs);
			
		if ((this.fadeTransitionStatus === this.constFadeTransitionStatusFadingToBlack) ||
			(this.fadeTransitionStatus === this.constFadeTransitionStatusFadingToBlackDone)) {
			blackFadeFraction = fadeCompletionFraction;
		}
		else if ((this.fadeTransitionStatus === this.constFadeTransitionStatusFadingFromBlack) ||
			(this.fadeTransitionStatus === this.constFadeTransitionStatusFadingFromBlackDone)) {
			blackFadeFraction = 1.0 - fadeCompletionFraction;				
		}
	}
	
	return blackFadeFraction;
}

/**
 * Clears the flags which indicate whether or not pre-generated overlay
 *  texture content has been generated
 */
MainLittleHelpersGameplayScene.prototype.clearOverlayContentGenerationFlags = function () {
	this.gameEndOverlayContentHasBeenGenerated = false;
	this.fadeOverlayContentHasBeenGenerated = false;
	this.gameCompletionOverlayContentHasBeenGenerated = false;
}

/**
 * Generates contents of the texture that will be used within the
 *  fade to black overlay implementation
 */
MainLittleHelpersGameplayScene.prototype.generateFadeOverlayContent = function(webGlCanvasContext,
																			   targetCanvasContext,
																			   targetTexture) {
	if (Utility.validateVar(webGlCanvasContext) && Utility.validateVar(targetCanvasContext) &&
		Utility.validateVar(targetTexture)) {
			
		targetCanvasContext.clearRect(0, 0, targetCanvasContext.canvas.width, targetCanvasContext.canvas.height);

		WebGlUtility.updateDynamicTextureWithCanvas(webGlCanvasContext, targetTexture, targetCanvasContext.canvas);
	}
}

/**
 * Generates the content to be rendered within the full-screen overlay at the end of the
 *  game (failure)
 *
 * @param webGlCanvasContext {WebGLRenderingContext} WebGL context used to render geometry
 *                                                   to a WebGL display buffer
 * @param targetCanvasContext {CanvasRenderingContext2D} Canvas context used to render the full-screen
 *                                                       overlay at the end of the game
 * @param targetTexture {WebGLTexture} Texture into which the data will finally be stored
 */
MainLittleHelpersGameplayScene.prototype.generateGameEndOverlayContent = function(webGlCanvasContext,
																				   targetCanvasContext,
																				   targetTexture) {
																						
	if (Utility.validateVar(webGlCanvasContext) && Utility.validateVar(targetCanvasContext) &&
		Utility.validateVar(targetTexture)) {

		targetCanvasContext.clearRect(0, 0, targetCanvasContext.canvas.width, targetCanvasContext.canvas.height);
		targetCanvasContext.fillStyle = this.gameEndOverlayBackgroundColor.getRgbaIntValueAsStandardString();
		targetCanvasContext.fillRect(0, 0, targetCanvasContext.canvas.width, targetCanvasContext.canvas.height);
		
		var gameOverTextBuffer = new StaticTextLineCanvasBuffer(Constants.gameOverFontSizePx,
			Constants.labelFont, Constants.labelFontStyle);
		gameOverTextBuffer.updateStaticTextString(Constants.stringGameOver);
		
		var happyHolidaysTextBuffer = new StaticTextLineCanvasBuffer(Constants.labelFontSizePx,
			Constants.labelFont, Constants.labelFontStyle);
		happyHolidaysTextBuffer.updateStaticTextString(Constants.messageText);

		var topCoord = (targetCanvasContext.canvas.height - (gameOverTextBuffer.requiredRenderingCanvasHeight() + 
			happyHolidaysTextBuffer.requiredRenderingCanvasHeight())) / 2.0;
		var gameOverLeftCoord = (targetCanvasContext.canvas.width - gameOverTextBuffer.requiredRenderingCanvasWidth()) / 2.0;
		var happyHolidaysLeftCoord = (targetCanvasContext.canvas.width - happyHolidaysTextBuffer.requiredRenderingCanvasWidth()) / 2.0;

		gameOverTextBuffer.renderText(targetCanvasContext, gameOverLeftCoord, topCoord);
		happyHolidaysTextBuffer.renderText(targetCanvasContext, happyHolidaysLeftCoord,
			topCoord + gameOverTextBuffer.requiredRenderingCanvasHeight());		

		WebGlUtility.updateDynamicTextureWithCanvas(webGlCanvasContext, targetTexture, targetCanvasContext.canvas);
	}
}

/**
 * Generates the content to be rendered within the full-screen overlay at the successful
 *  completion of the game
 *
 * @param webGlCanvasContext {WebGLRenderingContext} WebGL context used to render geometry
 *                                                   to a WebGL display buffer
 * @param targetCanvasContext {CanvasRenderingContext2D} Canvas context used to render the full-screen
 *                                                       overlay at the successful completion of the
 *                                                       game
 * @param targetTexture {WebGLTexture} Texture into which the data will finally be stored
 */
MainLittleHelpersGameplayScene.prototype.generateCompletionOverlayContent = function(webGlCanvasContext,
																			    	 targetCanvasContext,
																				     targetTexture) {

	if (Utility.validateVar(webGlCanvasContext) && Utility.validateVar(targetCanvasContext) &&
		Utility.validateVar(targetTexture)) {
			
		targetCanvasContext.clearRect(0, 0, targetCanvasContext.canvas.width, targetCanvasContext.canvas.height);
		targetCanvasContext.fillStyle = this.gameEndOverlayBackgroundColor.getRgbaIntValueAsStandardString();
		targetCanvasContext.fillRect(0, 0, targetCanvasContext.canvas.width, targetCanvasContext.canvas.height);
				
		var gameCompletionTextBuffer = new StaticTextLineCanvasBuffer(Constants.gameCompletedFontSizePx,
			Constants.labelFont, Constants.labelFontStyle);
		gameCompletionTextBuffer.updateStaticTextString(Constants.stringGameCompleted);
		
		var gameCompletionDetailTextBuffer = new StaticTextLineCanvasBuffer(Constants.labelFontSizePx,
			Constants.labelFont, Constants.labelFontStyle);
		gameCompletionDetailTextBuffer.updateStaticTextString(Constants.stringGameCompletedDetail);
		
		var happyHolidaysTextBuffer = new StaticTextLineCanvasBuffer(Constants.labelFontSizePx,
			Constants.labelFont, Constants.labelFontStyle);
		happyHolidaysTextBuffer.updateStaticTextString(Constants.messageText);		

		var totalRequiredTextHeight = gameCompletionTextBuffer.requiredRenderingCanvasHeight() +
			gameCompletionDetailTextBuffer.requiredRenderingCanvasHeight() + 
			happyHolidaysTextBuffer.requiredRenderingCanvasHeight();
		var topCoord = (targetCanvasContext.canvas.height - totalRequiredTextHeight) / 2.0;
		
		var gameCompletionLeftCoord = (targetCanvasContext.canvas.width - gameCompletionTextBuffer.requiredRenderingCanvasWidth()) / 2.0;
		var gameCompletionDetailLeftCoord = (targetCanvasContext.canvas.width - gameCompletionDetailTextBuffer.requiredRenderingCanvasWidth()) / 2.0;			
		var happyHolidaysLeftCoord = (targetCanvasContext.canvas.width - happyHolidaysTextBuffer.requiredRenderingCanvasWidth()) / 2.0;

		gameCompletionTextBuffer.renderText(targetCanvasContext, gameCompletionLeftCoord, topCoord);
		gameCompletionDetailTextBuffer.renderText(targetCanvasContext, gameCompletionDetailLeftCoord,
			topCoord + gameCompletionTextBuffer.requiredRenderingCanvasHeight());
		happyHolidaysTextBuffer.renderText(targetCanvasContext, happyHolidaysLeftCoord,
			topCoord + gameCompletionTextBuffer.requiredRenderingCanvasHeight() +
			2.0 * gameCompletionDetailTextBuffer.requiredRenderingCanvasHeight());
			
		WebGlUtility.updateDynamicTextureWithCanvas(webGlCanvasContext, targetTexture, targetCanvasContext.canvas);			
	}
}

/**
 * Renders the static tiles which comprise the level
 *
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 * @param targetCanvasContext {WebGLRenderingContext2D} Context onto which
 *                            							the scene data will be rendered
 */
MainLittleHelpersGameplayScene.prototype.renderLevelTiles = function(timeQuantum, targetCanvasContext) {
	if (this.currentLevelRepresentation !== null) {
		
		var levelPositionX = this.currentPositionInLevel.getX();
		var levelPositionY = this.currentPositionInLevel.getY();
		var tileIndexGridRect = this.currentLevelRepresentation.getVisibleTileRegionTileIndexGridRect(-levelPositionX,
			-levelPositionY);
		if (tileIndexGridRect !== null) {
			var rightMostColumnIndex = (tileIndexGridRect.getWidth() + tileIndexGridRect.left);
			var bottomMostRowIndex = (tileIndexGridRect.top - tileIndexGridRect.getHeight());
			for (var tileRowIndex = bottomMostRowIndex; tileRowIndex <= tileIndexGridRect.top; tileRowIndex++) {
				for (var tileColumnIndex = tileIndexGridRect.left; tileColumnIndex <= rightMostColumnIndex; tileColumnIndex++) {

					var tileAttributes = this.currentLevelRepresentation.getTileAttributesForTileAtPosition(tileRowIndex, tileColumnIndex);
					
					if ((tileAttributes !== null) && this.shouldTileTypeBeRendered(tileAttributes)) {
						var tileRect = this.currentLevelRepresentation.getTileRectInLevelSpace(tileRowIndex, tileColumnIndex,
							-levelPositionX, -levelPositionY);
						// (Rectangle.getCenter() assumes a rectangle with a standard 2D graphical
						// coordinate system, with coordinates decreasing from the top; therefore,
						// it will return an incorrect result in the WebGL coordinate system.)
						var tileRectCenterPoint = new Point2d((tileRect.left + (tileRect.width / 2.0)),
							(tileRect.top - (tileRect.height / 2.0)));
							
						var tileTextureKey = null;
						var texture = null;
						if (Utility.validateVar(tileAttributes.builtInTexture)) {
							tileTextureKey = this.levelBuiltInTextureToTextureKeyDict[tileAttributes.builtInTexture];
						}
						
						if (tileTextureKey !== null) {
							texture = globalResources.textureKeyValueStore[tileTextureKey];
						}
							
						var transformationMatrix = MathUtility.generateTranslationMatrix3d(tileRectCenterPoint.getX(),
							tileRectCenterPoint.getY(), 0.0);
						tileRenderWebGlDdata = WebGlUtility.objectRenderWebGlDataFromWebGlBufferData(
							this.webGlBufferDataLeveTileCube, this.shaderStandardTexturedObject);
					
						var attributeLocationData = this.getStandardShaderWebGlAttributeLocations(true);						
						var attributeData = this.getDefaultWebGlAttributeData();

						WebGlUtility.renderGeometry(tileRenderWebGlDdata, transformationMatrix, texture,
							targetCanvasContext, attributeLocationData, attributeData);
					}
				}
			}
		}
	}	
}

/**
 * Determines if the lego protagonist should be rendered within the
 *  current frame 
 *
 * @return True if the lego protagonist should be rendered within the
 *         current frame
 */
MainLittleHelpersGameplayScene.prototype.shouldRenderLegoProtagonist = function () {
	return (this.currentLegoProtagonistRenderIntervalFrameCount ===
		this.currentLegoProtagonistFrameRenderInterval);
}

/**
 * Updates rendering state information pertaining to rendering of the
 *  lego protagonist (e.g., whether or not the current frame should
 *  be rendered)
 */
MainLittleHelpersGameplayScene.prototype.updateLegoProtagonistRenderState = function () {	
	if (!this.isLegoProtagonistInvulnerable()) {
		this.currentLegoProtagonistFrameRenderInterval = 0;
	}
	else {
		this.currentLegoProtagonistFrameRenderInterval = this.constLegoProtagonistInvulnerabilityFrameInterval;
	}
	
	if (this.currentLegoProtagonistRenderIntervalFrameCount < this.currentLegoProtagonistFrameRenderInterval) {
		this.currentLegoProtagonistRenderIntervalFrameCount++
	}
	else {
		this.currentLegoProtagonistRenderIntervalFrameCount = 0;
	}
}

/**
 * Renders the lego protagonist
 *
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 * @param targetCanvasContext {WebGLRenderingContext2D} Context onto which
 *                            							the scene data will be rendered
 */
MainLittleHelpersGameplayScene.prototype.renderLegoProtagonist = function(timeQuantum, targetCanvasContext) {	
	var legoProtagonistComponentKeys = this.getAllLegoProtagonistComponentKeys();
	
	if (this.shouldRenderLegoProtagonist()) {
		var webGlAttributeLocationData = this.getStandardShaderWebGlAttributeLocations(false);
		var webGlAttributeData = this.getDefaultWebGlAttributeData();
		for (var currentKey of legoProtagonistComponentKeys) {
			var webGlBufferData = this.webGlBufferDataKeyValStore[currentKey];
			legoComponentWebGlData = WebGlUtility.objectRenderWebGlDataFromWebGlBufferData(
				webGlBufferData, this.shaderStandardObject);
			var componentTransformationMatrix = this.modelMatrixKeyValStore[currentKey];
			

			var renderSpaceTranslationMatrix = this.generateLegoProtagonistCompositeFinalPositioningMatrix();
			var finalTransformationMatrix = renderSpaceTranslationMatrix.multiply(componentTransformationMatrix);
			WebGlUtility.renderGeometry(legoComponentWebGlData, finalTransformationMatrix, null,
				targetCanvasContext, webGlAttributeLocationData, webGlAttributeData);
		}
	}
}

/**
 * Renders a single dynamic element/enemy
 *
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 * @param targetCanvasContext {WebGLRenderingContext2D} Context onto which
 *                            							the scene data will be rendered
 * @param alternateTransformationMatrix {MathExt.Matrix} Optional - an alternate matrix that will serve
 *                                                       as the base transformation matrix, as
 *                                                       opposed to the pre-determined base
 *                                                       transformation matrix within the internal
 *                                                       model base transformation matrix key-value
 *                                                       store (can be used to apply customized
 *                                                       element orientation)
 */
MainLittleHelpersGameplayScene.prototype.renderDynamicElement = function (element, targetCanvasContext, alternateTransformationMatrix) {
	if (Utility.validateVar(element)) {
		var webGlAttributeLocationData = this.getStandardShaderWebGlAttributeLocations(false);		
		var webGlAttributeData = this.getDefaultWebGlAttributeData();
		var webGlBufferData = this.webGlBufferDataKeyValStore[element.modelDataKey];
		var elementWebGlData = WebGlUtility.objectRenderWebGlDataFromWebGlBufferData(
			webGlBufferData, this.shaderStandardObject);
			
		var componentTransformationMatrix = Utility.validateVar(alternateTransformationMatrix) ?
			alternateTransformationMatrix : this.modelMatrixKeyValStore[element.modelDataKey];
	
		var renderSpacePosition = this.worldSpacePositionToTranslatedRenderSpacePosition(
			element.modelWorldSpacePosition.xCoord,
			element.modelWorldSpacePosition.yCoord,
			element.modelWorldSpacePosition.zCoord);

		var finalTransformationMatrix = MathUtility.generateTranslationMatrix3d(
			renderSpacePosition.xCoord, renderSpacePosition.yCoord, renderSpacePosition.zCoord);
			
		if (Utility.validateVar(componentTransformationMatrix)) {
			finalTransformationMatrix = finalTransformationMatrix.multiply(componentTransformationMatrix);
		}
	
		WebGlUtility.renderGeometry(elementWebGlData, finalTransformationMatrix, null,
			targetCanvasContext, webGlAttributeLocationData, webGlAttributeData);
	}	
}

/**
 * Renders collection of dynamic level elements
 *
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 * @param targetCanvasContext {WebGLRenderingContext2D} Context onto which
 *                            							the scene data will be rendered
 * @param elementCollection {Array} Collection of DynamicItemInstanceData/EnemyInstanceData objects
 *                                  which represent dynamic elements to be rendered
 * @param alternateTransformationMatrix {MathExt.Matrix} Optional - an alternate matrix that will serve
 *                                                       as the base transformation matrix, as
 *                                                       opposed to the pre-determined base
 *                                                       transformation matrix within the internal
 *                                                       model base transformation matrix key-value
 *                                                       store (can be used to apply customized
 *                                                       element orientation)
 */
MainLittleHelpersGameplayScene.prototype.renderDynamicElementCollection = function(timeQuantum, targetCanvasContext,
	elementCollection, alternateBaseTransformationMatrix) {
		
	if (Utility.validateVar(timeQuantum) && Utility.validateVar(targetCanvasContext) &&
		Utility.validateVar(elementCollection)) {
	
		for (var currentElement of elementCollection) {
			if (currentElement.isActive) {
				this.renderDynamicElement(currentElement, targetCanvasContext, alternateBaseTransformationMatrix);
			}
		}			
	}	
}

/**
 * Initiates a fade to black transition
 */
MainLittleHelpersGameplayScene.prototype.startFadeToBlack = function () {
	if (!this.isFadeTransitionInProgress()) {
		this.fadeTransitionStatus = this.constFadeTransitionStatusFadingToBlack;
		this.fadeTransitionStartTimeMs = this.totalElapsedSceneTimeMs;
	}
}

/**
 * Initiates a fade from black transition
 */
MainLittleHelpersGameplayScene.prototype.startFadeFromBlack = function () {
	if (!this.isFadeTransitionInProgress()) {
		this.fadeTransitionStatus = this.constFadeTransitionStatusFadingFromBlack;
		this.fadeTransitionStartTimeMs = this.totalElapsedSceneTimeMs;		
	}	
}

/** 
 * Determines if a fade transition operation is in progress
 *
 * @return {Boolean} True if a fade transition operation is in
 *                   progress
 */
MainLittleHelpersGameplayScene.prototype.isFadeTransitionInProgress = function () {
	return ((this.fadeTransitionStatus === this.constFadeTransitionStatusFadingToBlack) ||
		(this.fadeTransitionStatus === this.constFadeTransitionStatusFadingFromBlack));
}

/**
 * Determines if a fade transition has been recently completed
 * 
 * @return {Boolean} True if a fade transition has recently been completed
 */
MainLittleHelpersGameplayScene.prototype.isFadeTransitionInCompletionPhase = function () {
	return ((this.fadeTransitionStatus === this.constFadeTransitionStatusFadingToBlackDone) ||
		(this.fadeTransitionStatus === this.constFadeTransitionStatusFadingFromBlackDone));	
}

/** 
 * Resets the fade transition status, effectively concluding a fade
 *  transition
 */
MainLittleHelpersGameplayScene.prototype.resetFadeTransitionStatus = function () {
	this.fadeTransitionStatus = this.constFadeTransitionStatusNone;
}

/**
 * Updates the operation state - a pending operation state may have been
 *  requested during a previous run-loop iteration that could not be
 *  immediately applied
 */
MainLittleHelpersGameplayScene.prototype.updatePendingOperationState = function () {
	if (this.operationState !== this.pendingOperationState) {
		if (!this.isFadeTransitionInProgress()) {
			this.operationState = pendingOperationState;
		}	
	}
}

/**
 * Updates the time-based completion fraction/status of a
 *  "fade-to-black" operation
 */
MainLittleHelpersGameplayScene.prototype.updateFadeTransitionStatus = function () {
	if (this.fadeTransitionStatus !== this.constFadeTransitionStatusNone) {
		fadeCompletionFraction =
			Math.min(1.0, (this.totalElapsedSceneTimeMs - this.fadeTransitionStartTimeMs) / 
			this.constFadeDurationMs);
		
		if (fadeCompletionFraction >= 1.0) {
			if (this.fadeTransitionStatus === this.constFadeTransitionStatusFadingToBlack) {
				this.fadeTransitionStatus = this.constFadeTransitionStatusFadingToBlackDone;
			}
			else if (this.fadeTransitionStatus === this.constFadeTransitionStatusFadingFromBlack) {
				this.fadeTransitionStatus = this.constFadeTransitionStatusFadingFromBlackDone
			}
		}		
	}
}

/**
 * Updates operation logic related to game state (level activation, operation state
 *  etc.)
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 */
MainLittleHelpersGameplayScene.prototype.updateStateInformationForOperationLogic = function(timeQuantum) {	
	this.updateFadeTransitionStatus();
	this.updatePendingOperationState();
	
	if (this.discoveredGoalItemCount === this.goalItemInstanceDataCollection.length) {
		if (this.currentLevelIndex < this.levelKeyCollection.length) {
			if (this.isInActiveOperationState()) {
				this.setOperationState(this.constOperationStateInterLevelPause);
				this.interLevelPauseStartTimeMs = this.totalElapsedSceneTimeMs;
			}
			else if (this.isInterLevelPauseState()) {				
				if ((this.totalElapsedSceneTimeMs - this.interLevelPauseStartTimeMs) >= this.constInterLevelPauseDurationMs) {					
					if (!this.isFadeTransitionInProgress() && !this.isInGameCompletionState()) {						
						if (this.isFadeTransitionInCompletionPhase()) {
							this.setOperationState(this.constOperationStateActive);
							this.setupNewLevelState(this.currentLevelIndex + 1);
							this.resetFadeTransitionStatus();
						}
						else {
							this.startFadeToBlack();
						}
					}
				}
			}
		}
	}
	else {
		this.legoProtagonistCurrentHealth -= (this.constLegoProtagonistHealthDecreaseRatePerMs * timeQuantum);
	}
	
	if (this.legoProtagonistCurrentHealth <= 0.0) {
		this.setOperationState(this.constOperationStateInactive);
	}	
}

/**
 * The determine if the game is in a non-completion, non-paused,
 *  active state
 *
 * @return True if the game is immediately in an active state
 */
MainLittleHelpersGameplayScene.prototype.isInActiveOperationState = function () {
	return (this.operationState === this.constOperationStateActive);
}

MainLittleHelpersGameplayScene.prototype.isInterLevelPauseState = function () {
	return (this.operationState === this.constOperationStateInterLevelPause);
}

MainLittleHelpersGameplayScene.prototype.setOperationState = function (newOperationState) {
	if (Utility.validateVar(newOperationState)) {
		this.pendingOperationState = newOperationState;
		
		if (this.isInActiveOperationState() && (newOperationState != this.constOperationStateActive)) {
			this.gameActivityEndTimeMs = this.totalElapsedSceneTimeMs;
		}
		
		// Operation states shouldn't change during a
		// fade transition.
		if (!this.isFadeTransitionInProgress()) {
			this.operationState = newOperationState;
		}
	}
}

/**
 * Determines if the game has recently concluded unsuccessfully
 *
 * @return {Boolean} True if a game over state is active
 */
MainLittleHelpersGameplayScene.prototype.isInGameOverState = function () {
	return (!this.isInActiveOperationState() && (this.legoProtagonistCurrentHealth <= 0.0));
}

/**
 * Determines if the game has been successfully completed
 *
 * @return {Boolean} True if the game has been successfully completed
 */
MainLittleHelpersGameplayScene.prototype.isInGameCompletionState = function () {
	var finalLevelCompleted = (this.discoveredGoalItemCount === this.goalItemInstanceDataCollection.length) &&
		(this.currentLevelIndex >= (this.levelKeyCollection.length - 1));
	
	return (!this.isInActiveOperationState() && finalLevelCompleted &&
		(this.legoProtagonistCurrentHealth > 0));
}

/**
 * Renders all scene dynamic elements (goal elements, enemy instances)
 *
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 * @param targetCanvasContext {WebGLRenderingContext2D} Context onto which
 *                            							the scene data will be rendered
 */
MainLittleHelpersGameplayScene.prototype.renderDynamicElements = function(timeQuantum, targetCanvasContext) {
	var goalRotationMatrix = MathUtility.generateRotationMatrix3dAxisY(this.goalItemRotationRate * this.totalElapsedSceneTimeMs);
	this.renderDynamicElementCollection(timeQuantum, targetCanvasContext, this.goalItemInstanceDataCollection,
		goalRotationMatrix);
	this.renderDynamicElementCollection(timeQuantum, targetCanvasContext, this.enemyInstanceDataCollection);
}

/**
 * Renders the game goal guide/status overlay
 *
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 * @param targetCanvasContext {WebGLRenderingContext2D} Context onto which
 *                            							the scene data will be rendered
 */
MainLittleHelpersGameplayScene.prototype.renderGameGoalStatusOverlay = function(timeQuantum, targetCanvasContext) {
	var gameGoalStatusOverlayTexture = globalResources.getGoalStatusOverlayTexture();	
	if (this.shouldUpdateOverlay()) {
		this.updateGameGoalText();
		var gameGoalStatusOverlayCanvasContext = globalResources.getGoalStatusOverlayCanvasContext();
		gameGoalStatusOverlayCanvasContext.clearRect(0, 0, gameGoalStatusOverlayCanvasContext.canvas.width,
			gameGoalStatusOverlayCanvasContext.canvas.height);
		this.renderStaticTextBufferToTexture(timeQuantum, this.goalStatusTextCanvasBuffer, this.constOverlayTextLeftMargin,
			gameGoalStatusOverlayCanvasContext, gameGoalStatusOverlayTexture, targetCanvasContext, true);
	}
		
	var overlayRenderWebGlData = WebGlUtility.objectRenderWebGlDataFromWebGlBufferData(	
		this.goalStatusOverlayRenderWebGlData, this.shaderStandardOverlayTextureRender);
		
	var transformationMatrix = new MathExt.Matrix(this.constTransformationMatrixRowCount,
		this.constTransformationMatrixColumnCount);
	transformationMatrix.setToIdentity();
	var webGlAttributeLocationData = this.getStandardShaderWebGlAttributeLocations(true);
	var webGlAttributeData = this.getDefaultWebGlAttributeData();
	WebGlUtility.renderGeometry(overlayRenderWebGlData, transformationMatrix, gameGoalStatusOverlayTexture,
		targetCanvasContext, webGlAttributeLocationData, webGlAttributeData);
}

/**
 * Renders a textured backdrop, scrollable tiled backdrop
 *
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 * @param targetCanvasContext {WebGLRenderingContext2D} Context onto which
 *                            							the scene data will be rendered
 */
MainLittleHelpersGameplayScene.prototype.renderBackdrop = function(timeQuantum, targetCanvasContext) {
	if (this.currentBackdropTextureKey !== null) {
		var backdropTexture = globalResources.textureKeyValueStore[this.currentBackdropTextureKey];
		
		var backdropRenderWebGlData = WebGlUtility.objectRenderWebGlDataFromWebGlBufferData(	
			this.backdropRenderWebGlData, this.shaderBackdropRender);
		
		var transformationMatrix = new MathExt.Matrix(this.constTransformationMatrixRowCount,
			this.constTransformationMatrixColumnCount);
		transformationMatrix.setToIdentity();
		var webGlAttributeLocationData = this.getStandardShaderWebGlAttributeLocations(true);
		var webGlAttributeData = this.getDefaultWebGlAttributeData();	

		var textureOffsetX = ((this.currentPositionInLevel.xCoord) / 2.0) / this.constBackdropScrollRateDivisor;
		var textureOffsetY = (-(this.currentPositionInLevel.yCoord) / 2.0) / this.constBackdropScrollRateDivisor;
		var textureSize = globalResources.textureSizeKeyValueStore[this.currentBackdropTextureKey];		
		function textureCoordOffsetUniformSetup(shaderProgram) {
			var textureOffsetUniformLocation = targetCanvasContext.getUniformLocation(shaderProgram, "vTextureCoordOffset");
			targetCanvasContext.uniform2fv(textureOffsetUniformLocation, [textureOffsetX, textureOffsetY]);
			
			var textureDimensionsUniformLocation = targetCanvasContext.getUniformLocation(shaderProgram, "vTextureDimensions");
			targetCanvasContext.uniform2iv(textureDimensionsUniformLocation, new Int32Array(textureSize));
		}
		
		WebGlUtility.renderGeometry(backdropRenderWebGlData, transformationMatrix, backdropTexture,
			targetCanvasContext, webGlAttributeLocationData, webGlAttributeData, textureCoordOffsetUniformSetup);
	}
}

/**
 * Renders the Spirit meter overlay
 *
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 * @param targetCanvasContext {WebGLRenderingContext2D} Context onto which
 *                            							the scene data will be rendered
 */
MainLittleHelpersGameplayScene.prototype.renderSpiritGaugeOverlay = function(timeQuantum, targetCanvasContext) {
	var spiritGaugeOverlayTexture = globalResources.getGaugeOverlayTexture();
	if (this.shouldUpdateOverlay()) {
		var gaugeOverlayCanvasContext = globalResources.getGaugeOverlayCanvasContext();
		var spiritGaugeHeightDifference = 5;
		var spiritGaugeHeight = gaugeOverlayCanvasContext.canvas.height - spiritGaugeHeightDifference;
		
		gaugeOverlayCanvasContext.clearRect(0, 0, gaugeOverlayCanvasContext.canvas.width,
			gaugeOverlayCanvasContext.canvas.height);
		this.updateSpiritGaugeMagnitudeRepresentation(gaugeOverlayCanvasContext, this.constSpiritGaugeWidth,
			spiritGaugeHeight, this.spiritLabelCanvasBuffer.requiredRenderingCanvasWidth())		
		this.renderStaticTextBufferToTexture(timeQuantum, this.spiritLabelCanvasBuffer, this.constOverlayTextLeftMargin,
			gaugeOverlayCanvasContext, spiritGaugeOverlayTexture, targetCanvasContext, true);
	}
	
	var overlayRenderWebGlData = WebGlUtility.objectRenderWebGlDataFromWebGlBufferData(	
		this.gaugeOverlayRenderWebGlData, this.shaderStandardOverlayTextureRender);
	
	var transformationMatrix = new MathExt.Matrix(this.constTransformationMatrixRowCount,
		this.constTransformationMatrixColumnCount);
	transformationMatrix.setToIdentity();
	var webGlAttributeLocationData = this.getStandardShaderWebGlAttributeLocations(true);
	var webGlAttributeData = this.getDefaultWebGlAttributeData();
	WebGlUtility.renderGeometry(overlayRenderWebGlData, transformationMatrix, spiritGaugeOverlayTexture,
		targetCanvasContext, webGlAttributeLocationData, webGlAttributeData);
}

/**
 * Renders the "Game Over" overlay
 *
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 * @param targetCanvasContext {WebGLRenderingContext2D} Context onto which
 *                            							the scene data will be rendered
 */
MainLittleHelpersGameplayScene.prototype.renderGameEndOverlay = function(timeQuantum, targetCanvasContext) {
	if (this.isInGameOverState()) {
		if (!this.gameEndOverlayContentHasBeenGenerated) {
			this.clearOverlayContentGenerationFlags();
			var gameEndOverlayCanvasContext = globalResources.getFullScreenOverlayCanvasContext();
			var gameEndOverlayTexture = globalResources.getFullScreenOverlayTexture();
			this.generateGameEndOverlayContent(targetCanvasContext, gameEndOverlayCanvasContext,
				gameEndOverlayTexture);
			this.gameEndOverlayContentHasBeenGenerated = true;
		}
		
		var fullScreenOverlayTexture = globalResources.getFullScreenOverlayTexture();
		var overlayRenderWebGlData = WebGlUtility.objectRenderWebGlDataFromWebGlBufferData(
			this.fullScreenOverlayWebGlData, this.shaderStandardOverlayTextureRender);
		
		var transformationMatrix = new MathExt.Matrix(this.constTransformationMatrixRowCount,
			this.constTransformationMatrixColumnCount);
		transformationMatrix.setToIdentity();
		var webGlAttributeLocationData = this.getStandardShaderWebGlAttributeLocations(true);
		var webGlAttributeData = this.getDefaultWebGlAttributeData();		
		WebGlUtility.renderGeometry(overlayRenderWebGlData, transformationMatrix, fullScreenOverlayTexture,
			targetCanvasContext, webGlAttributeLocationData, webGlAttributeData);
	}
}

/**
 * Renders the overlay that indicates successfull completion of the game
 *
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 * @param targetCanvasContext {WebGLRenderingContext2D} Context onto which
 *                            							the scene data will be rendered
 */
MainLittleHelpersGameplayScene.prototype.renderGameCompletionOverlay = function(timeQuantum, targetCanvasContext) {
	if (this.isInGameCompletionState()) {
		if (!this.gameCompletionOverlayContentHasBeenGenerated) {
			this.clearOverlayContentGenerationFlags();
			var gameCompletionOverlayCanvasContext = globalResources.getFullScreenOverlayCanvasContext();
			var gameCompletionOverlayTexture = globalResources.getFullScreenOverlayTexture();
			this.generateCompletionOverlayContent(targetCanvasContext, gameCompletionOverlayCanvasContext,
				gameCompletionOverlayTexture);
			this.gameCompletionOverlayContentHasBeenGenerated = true;		
			
		}

		var fullScreenOverlayTexture = globalResources.getFullScreenOverlayTexture();
		var overlayRenderWebGlData = WebGlUtility.objectRenderWebGlDataFromWebGlBufferData(
			this.fullScreenOverlayWebGlData, this.shaderStandardOverlayTextureRender);
			
		var transformationMatrix = new MathExt.Matrix(this.constTransformationMatrixRowCount,
			this.constTransformationMatrixColumnCount);
		transformationMatrix.setToIdentity();
		var webGlAttributeLocationData = this.getStandardShaderWebGlAttributeLocations(true);
		var webGlAttributeData = this.getDefaultWebGlAttributeData();		
		WebGlUtility.renderGeometry(overlayRenderWebGlData, transformationMatrix, fullScreenOverlayTexture,
			targetCanvasContext, webGlAttributeLocationData, webGlAttributeData);
		}
}

/**
 * Renders the overlay used to employ a "fade" transition
 *
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 * @param targetCanvasContext {WebGLRenderingContext2D} Context onto which
 *                            							the scene data will be rendered
 */
MainLittleHelpersGameplayScene.prototype.renderFadeOverlay = function(timeQuantum, targetCanvasContext) {
	if (this.isFadeTransitionInProgress()) {
		var fadeOverlayCanvasContext = globalResources.getFullScreenOverlayCanvasContext();
		
		if (!this.fadeOverlayContentHasBeenGenerated) {
			this.clearOverlayContentGenerationFlags();
			var fadeOverlayTexture = globalResources.getFullScreenOverlayTexture();
			this.generateFadeOverlayContent(targetCanvasContext, fadeOverlayCanvasContext,
				fadeOverlayTexture);
			this.fadeOverlayContentHasBeenGenerated = true;
		}
		
		var fullScreenOverlayTexture = globalResources.getFullScreenOverlayTexture();
		var overlayRenderWebGlData = WebGlUtility.objectRenderWebGlDataFromWebGlBufferData(
			this.fullScreenOverlayWebGlData, this.shaderBlackFader);
		
		var transformationMatrix = new MathExt.Matrix(this.constTransformationMatrixRowCount,
			this.constTransformationMatrixColumnCount);
		transformationMatrix.setToIdentity();
		var webGlAttributeLocationData = this.getStandardShaderWebGlAttributeLocations(true);
		var webGlAttributeData = this.getDefaultWebGlAttributeData();
		
		var fadeFraction = this.getBlackFadeFraction();
		function fadeUniformSetupFadeFraction(shaderProgram) {
			var fadeFractionUniformLocation = targetCanvasContext.getUniformLocation(shaderProgram, "fadeFraction");
				targetCanvasContext.uniform1f(fadeFractionUniformLocation, fadeFraction);
		}
		
		WebGlUtility.renderGeometry(overlayRenderWebGlData, transformationMatrix, fullScreenOverlayTexture,
			targetCanvasContext, webGlAttributeLocationData, webGlAttributeData, fadeUniformSetupFadeFraction);
	}
}


/**
 * Renders the text buffer output to a specified canvas context
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 * @param staticTextBuffer {StaticTextLineCanvasBuffer} Object that is used to store the rendered
 *                                                      text representation
 * @param coordX {Number} The starting location of the text along the X-axis within the
 *                        output texture
 * @param targetCanvasContext {CanvasRenderingContext2D} The output canvas context
 *                                                       to which the text buffer
 *                                                       will be rendered
 * @param targetTexture {WebGLTexture} The texture in which the buffer will be finally store
 * @param webGlCanvasContext {WebGLRenderingContext2D} A WebGL rendering context used for
 *                                                     writing the final output into a texture
 * @param drawBackground {Boolean} When set to true, a solid background will be drawn
 *                                 before the text is drawn.
 */
MainLittleHelpersGameplayScene.prototype.renderStaticTextBufferToTexture = function(timeQuantum, staticTextBuffer, coordX,
																				   targetCanvasContext, targetTexture,
																				   webGlCanvasContext, drawBackground) {
				
	if (Utility.validateVar(timeQuantum) && Utility.validateVarAgainstType(staticTextBuffer, StaticTextLineCanvasBuffer) &&
		Utility.validateVar(targetCanvasContext) && Utility.validateVar(webGlCanvasContext) &&
		Utility.validateVar(targetTexture)) {
			
		// Clear the background of the area where the text will be rendered...
		targetCanvasContext.clearRect(coordX, 0, staticTextBuffer.requiredRenderingCanvasWidth(),
			staticTextBuffer.requiredRenderingCanvasHeight());
	
		// Draw a background strip in order to enhance readability.
		if (Utility.validateVar(drawBackground) && drawBackground) {
			targetCanvasContext.save();
			targetCanvasContext.fillStyle = this.defaultTextAreaBackgroundColor.getRgbaIntValueAsStandardString();
			
			targetCanvasContext.fillRect(0, 0, targetCanvasContext.canvas.width, staticTextBuffer.getTextAreaHeight());
				
			targetCanvasContext.restore();
		}
		
		staticTextBuffer.renderText(targetCanvasContext, coordX, 0);
	
		WebGlUtility.updateDynamicTextureWithCanvas(webGlCanvasContext, targetTexture, targetCanvasContext.canvas);
	}
}

/**
 * Renders all game overlays
 *
 * @param timeQuantum {number} A time quantum that represents the time delta
 *                             between the current rendering invocation and the
 *                             last rendering invocation (milliseconds)
 * @param targetCanvasContext {WebGLRenderingContext2D} Context onto which
 *                            							the scene data will be rendered
 */
MainLittleHelpersGameplayScene.prototype.renderOverlayBitmaps = function(timeQuantum, targetCanvasContext) {
	this.renderGameGoalStatusOverlay(timeQuantum, targetCanvasContext);
	this.renderSpiritGaugeOverlay(timeQuantum, targetCanvasContext);
	// Conditionally render the "Game Over" overlay.
	this.renderGameEndOverlay(timeQuantum, targetCanvasContext);
	// Conditionally render the game completion overlay.
	this.renderGameCompletionOverlay(timeQuantum, targetCanvasContext);
	this.renderFadeOverlay(timeQuantum, targetCanvasContext);
}

/**
 * Renders the primary, texture-based portion of the scene
 * @param timeQuantum {number} Time delta with respect to the previously-executed
 *                             animation step (milliseconds)
 * @param targetCanvasContext {WebGLRenderingContext2D} Context onto which
 *                            							the scene data will be rendered
 */
MainLittleHelpersGameplayScene.prototype.renderScene = function(timeQuantum, targetCanvasContext) {
	var sceneInstance = this;
	
	function sceneRenderCallback(timeInterval) {
		targetCanvasContext.clear(targetCanvasContext.COLOR_BUFFER_BIT);
		
		sceneInstance.renderBackdrop(timeQuantum, targetCanvasContext);
		sceneInstance.renderLevelTiles(timeQuantum, targetCanvasContext);
		sceneInstance.renderLegoProtagonist(timeQuantum, targetCanvasContext);
		sceneInstance.renderDynamicElements(timeQuantum, targetCanvasContext);
		sceneInstance.renderOverlayBitmaps(timeQuantum, targetCanvasContext);
	}
	
	window.requestAnimationFrame(sceneRenderCallback);
}

/**
 * Executes a time-parameterized single scene animation step
 * @param timeQuantum {number} Time delta with respect to the previously-executed
 *                             animation step (milliseconds)
 * @param targetCanvasContext {WebGLRenderingContext2D} Context onto which
 *                            the scene data will be drawn
 */
MainLittleHelpersGameplayScene.prototype.executeStep = function(timeQuantum, targetCanvasContext) {
	this.renderScene(timeQuantum, targetCanvasContext);	
	this.updateStateInformationForWorldObjects(timeQuantum);
	this.updateStateInformationForWorld(timeQuantum);
	this.evaluateLegoProtagonistDynamicItemCollisions();
	this.updateStateInformationForOperationLogic(timeQuantum);
	this.updateOverlayRefreshInterval(timeQuantum);

	this.totalElapsedSceneTimeMs += timeQuantum;	
}
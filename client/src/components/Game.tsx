import { useEffect, useState } from "react";
import { useGame } from "../lib/stores/useGame";
import { useMaze } from "../lib/stores/useMaze";
import { useAudio } from "../lib/stores/useAudio";
import MazeCanvas from "./MazeCanvas";
import TouchControls from "./TouchControls";
import GameUI from "./GameUI";

export default function Game() {
  const { phase, playerRole, gameMode, roomCode, currentLevel, isCreator, partnerJoined, bothPlayersReady, start, restart, nextLevel, switchRoles, setCreatorRole, selectRole, createGame, joinGame, registerPlayerJoin, markPlayerReady } = useGame();
  const { generateSharedMaze, currentLevel: mazeLevel } = useMaze();
  const { backgroundMusic, isMuted, playBackgroundMusic, pauseBackgroundMusic, playPartnerJoined } = useAudio();
  const [joinCode, setJoinCode] = useState("");
  const [roleSyncInterval, setRoleSyncInterval] = useState<number | null>(null);
  const [partnerJoinCheckInterval, setPartnerJoinCheckInterval] = useState<number | null>(null);
  const [bothPlayersConfirmedReady, setBothPlayersConfirmedReady] = useState(false);

  // Check for existing room code in URL when component mounts
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const existingRoomCode = urlParams.get('room');
    
    if (existingRoomCode && phase === "ready") {
      // Auto-join the room if there's a room code in URL
      joinGame(existingRoomCode);
    }
  }, [phase, joinGame]);

  // Initialize the first maze when room is set up
  useEffect(() => {
    if (phase === "room-setup" && roomCode) {
      generateSharedMaze(15, 15); // Start with a 15x15 SHARED maze
    }
  }, [phase, roomCode, generateSharedMaze]);

  // Register player join and monitor for partner joining
  useEffect(() => {
    if (phase === "room-setup" && roomCode) {
      // Register this player's join immediately
      registerPlayerJoin();
      
      // Start polling for partner join status
      const interval = window.setInterval(async () => {
        try {
          const response = await fetch(`/api/room-status/${roomCode}`);
          if (response.ok) {
            const data = await response.json();
            const state = useGame.getState();
            
            if (data.bothPlayersJoined && !state.partnerJoined) {
              // Partner just joined! Play notification sound for creator
              if (state.isCreator) {
                playPartnerJoined();
                console.log("🎉 Partner joined the room!");
              }
              
              // Update state to reflect both players joined
              useGame.setState({ 
                partnerJoined: true,
                bothPlayersReady: true 
              });
            }
            
            // For non-creators: Check if creator has started role selection
            if (!state.isCreator && data.bothPlayersJoined) {
              // Check if roles are being assigned (creator entered role-select phase)
              const roleResponse = await fetch(`/api/role/${roomCode}`);
              if (roleResponse.ok) {
                const roleData = await roleResponse.json();
                // If there are any roles assigned, creator has started role selection
                if (roleData.roles && (roleData.roles.player1 || roleData.roles.player2)) {
                  console.log("Creator started role selection - transitioning to role-select phase");
                  selectRole(); // Transition partner to role-select phase
                }
              }
            }
          }
        } catch (error) {
          console.error('Failed to check room status:', error);
        }
      }, 1000); // Poll every second
      
      setPartnerJoinCheckInterval(interval);
      
      return () => {
        if (interval) {
          clearInterval(interval);
          setPartnerJoinCheckInterval(null);
        }
      };
    } else {
      // Clean up interval if not needed
      if (partnerJoinCheckInterval) {
        clearInterval(partnerJoinCheckInterval);
        setPartnerJoinCheckInterval(null);
      }
    }
  }, [phase, roomCode, registerPlayerJoin, playPartnerJoined, isCreator, partnerJoined, selectRole]);

  // Handle background music during gameplay
  useEffect(() => {
    if (phase === "playing" && !isMuted) {
      playBackgroundMusic();
    } else {
      pauseBackgroundMusic();
    }
  }, [phase, isMuted, playBackgroundMusic, pauseBackgroundMusic]);

  // Role assignment and ready confirmation synchronization during role-select phase
  useEffect(() => {
    if (phase === "role-select" && roomCode) {
      // Start polling for role assignment and ready status
      const interval = window.setInterval(async () => {
        try {
          // Check for role assignment
          const roleResponse = await fetch(`/api/role/${roomCode}`);
          if (roleResponse.ok) {
            const roleData = await roleResponse.json();
            const { playerId } = useGame.getState();
            const assignedRole = playerId ? roleData.roles[playerId] : null;
            
            if (assignedRole && assignedRole !== playerRole) {
              // Role was assigned - update local state and mark as ready
              useGame.setState({ playerRole: assignedRole });
              console.log(`Role assigned: ${assignedRole}`);
              
              // Mark this player as ready after receiving role
              try {
                const bothReady = await markPlayerReady();
                console.log(`Player marked as ready. Both players ready: ${bothReady}`);
                setBothPlayersConfirmedReady(bothReady === true);
              } catch (error) {
                console.error('Error marking player ready:', error);
                setBothPlayersConfirmedReady(false);
              }
            }
          }
          
          // Check if game has started (both players marked ready)
          const gameStateResponse = await fetch(`/api/game-state/${roomCode}`);
          if (gameStateResponse.ok) {
            const gameStateData = await gameStateResponse.json();
            const currentPhase = useGame.getState().phase;
            const currentPlayerRole = useGame.getState().playerRole;
            
            if (gameStateData.phase === 'playing' && currentPhase === 'role-select' && currentPlayerRole) {
              console.log('Both players ready - starting game simultaneously');
              start();
            }
          }
        } catch (error) {
          console.error('Failed to sync role/ready state:', error);
        }
      }, 1000); // Poll every second
      
      setRoleSyncInterval(interval);
      console.log('Started role/ready state sync');
      
      return () => {
        if (interval) {
          clearInterval(interval);
          setRoleSyncInterval(null);
          console.log('Stopped role/ready state sync');
        }
      };
    } else {
      // Clean up interval if not needed
      if (roleSyncInterval) {
        clearInterval(roleSyncInterval);
        setRoleSyncInterval(null);
      }
    }
  }, [phase, roomCode, playerRole, start, markPlayerReady]);

  // Handle role switching synchronization for non-creators during level-complete phase
  useEffect(() => {
    if (phase === "level-complete" && roomCode && !isCreator) {
      const interval = window.setInterval(async () => {
        try {
          // Check for role updates
          const roleResponse = await fetch(`/api/role/${roomCode}`);
          if (roleResponse.ok) {
            const roleData = await roleResponse.json();
            const { playerId } = useGame.getState();
            const serverRole = playerId ? roleData.roles[playerId] : null;
            
            if (serverRole && serverRole !== playerRole) {
              console.log(`Role switched: ${playerRole} → ${serverRole}`);
              useGame.setState({ playerRole: serverRole });
            }
          }
          
          // Check if game state changed to playing (next level started)
          const gameStateResponse = await fetch(`/api/game-state/${roomCode}`);
          if (gameStateResponse.ok) {
            const gameStateData = await gameStateResponse.json();
            const currentPhase = useGame.getState().phase;
            
            if (gameStateData.phase === 'playing' && currentPhase === 'level-complete') {
              console.log('Partner started next level - transitioning to playing phase');
              // Update current level and start game
              useGame.setState({ currentLevel: gameStateData.currentLevel });
              const { nextLevel: mazeNextLevel } = useMaze.getState();
              mazeNextLevel();
              const newSize = Math.min(25, 15 + gameStateData.currentLevel * 2);
              generateSharedMaze(newSize, newSize);
              start();
            }
          }
        } catch (error) {
          console.error('Failed to sync level progression:', error);
        }
      }, 1000); // Poll every second
      
      return () => clearInterval(interval);
    }
  }, [phase, roomCode, isCreator, playerRole, start, generateSharedMaze]);

  const handleStartGame = () => {
    selectRole();
  };

  const handleRestartGame = () => {
    restart();
    generateSharedMaze(15, 15);
  };

  const handleNextLevel = () => {
    // Use game store nextLevel which handles server synchronization
    nextLevel();
    const { nextLevel: mazeNextLevel } = useMaze.getState();
    mazeNextLevel(); // Also increment maze level
    const newLevel = useMaze.getState().currentLevel;
    const newSize = Math.min(25, 15 + newLevel * 2); // Increase maze size each level
    generateSharedMaze(newSize, newSize);
    start();
  };

  if (phase === "ready") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 text-white">Maze Navigator</h1>
          <p className="text-gray-300 mb-8 text-lg">
            Cooperative maze game for two players
          </p>
          <div className="flex flex-col gap-4 w-full max-w-sm">
            <button 
              onClick={createGame}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors"
            >
              CREATE GAME
            </button>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter 4-digit code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.slice(0, 4))}
                className="flex-1 px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-600 focus:border-blue-500 focus:outline-none text-center text-xl"
                maxLength={4}
              />
              <button 
                onClick={() => joinCode.length === 4 && joinGame(joinCode)}
                disabled={joinCode.length !== 4}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg text-xl transition-colors"
              >
                JOIN
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "room-setup") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2 text-white">Game Room</h1>
          {gameMode === "create" ? (
            <div className="bg-gray-800 p-6 rounded-lg mb-6">
              <p className="text-gray-300 mb-4">Share this code with your partner:</p>
              <div className="text-6xl font-bold text-blue-400 mb-4 tracking-widest">
                {roomCode}
              </div>
              <button
                onClick={() => navigator.clipboard?.writeText(window.location.href)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg mb-4"
              >
                Copy Link
              </button>
              
              {!partnerJoined ? (
                <div className="mt-4">
                  <div className="text-2xl mb-2">⏳</div>
                  <p className="text-yellow-300 font-semibold">
                    Waiting for partner to join...
                  </p>
                  <div className="animate-pulse mt-2">
                    <div className="flex justify-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <div className="text-2xl mb-2">🎉</div>
                  <p className="text-green-300 font-semibold mb-4">
                    Partner has joined the room!
                  </p>
                  <button 
                    onClick={selectRole}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-xl transition-colors"
                  >
                    SELECT ROLES
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-800 p-6 rounded-lg mb-6">
              <p className="text-gray-300 mb-2">Joined game room:</p>
              <div className="text-4xl font-bold text-green-400 mb-4 tracking-widest">
                {roomCode}
              </div>
              <div className="mt-4">
                <div className="text-2xl mb-2">⏳</div>
                <p className="text-yellow-300 font-semibold">
                  Waiting for room creator to select roles...
                </p>
                <div className="animate-pulse mt-2">
                  <div className="flex justify-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (phase === "role-select") {
    if (isCreator) {
      // Creator selects roles for both players
      if (playerRole) {
        // Creator has selected role, waiting for partner sync
        return (
          <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">🎭</div>
              <h2 className="text-2xl font-bold mb-4 text-green-400">Roles Assigned!</h2>
              <div className="bg-green-900 bg-opacity-30 border border-green-600 rounded-lg p-4 mb-4 max-w-md">
                <p className="text-lg text-green-200 mb-2">
                  <strong>You are the {playerRole === 'navigator' ? '🕹️ Navigator' : '🗺️ Guide'}!</strong>
                </p>
                <p className="text-sm text-green-300 mb-2">
                  Your partner is the {playerRole === 'navigator' ? '🗺️ Guide' : '🕹️ Navigator'}
                </p>
                <p className="text-sm text-green-300">
                  {playerRole === 'navigator' 
                    ? 'Control movement with limited visibility. Follow your guide\'s directions!'
                    : 'You can see the full maze. Help guide the Navigator to the exit!'
                  }
                </p>
              </div>
              {bothPlayersConfirmedReady ? (
                <>
                  <div className="text-2xl mb-2">🚀</div>
                  <p className="text-lg text-gray-300 mb-2">
                    Both players ready! Starting game...
                  </p>
                  <p className="text-sm text-gray-400">
                    Game starting in moments
                  </p>
                </>
              ) : (
                <>
                  <div className="text-2xl mb-2">✅</div>
                  <p className="text-lg text-gray-300 mb-2">
                    Role confirmed! Waiting for partner...
                  </p>
                  <p className="text-sm text-gray-400">
                    Game will start when both players are ready
                  </p>
                </>
              )}
              <div className="animate-pulse mt-2">
                <div className="flex justify-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        );
      } else {
        // Creator hasn't selected role yet
        return (
          <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2 text-blue-400">👑 Choose Roles</h2>
              <p className="text-sm text-gray-300 mb-3">
                As the room creator, you choose which role you'll play
              </p>
              <div className="bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg p-2 mb-4 max-w-md">
                <p className="text-xs text-blue-200">
                  👑 <strong>You are the room creator</strong><br/>
                  Your partner will automatically get the other role
                </p>
              </div>
            </div>

          <div className="grid grid-cols-2 gap-3 max-w-md w-full mb-4">
            {/* Navigator Role */}
            <div className="bg-gray-800 rounded-lg p-3 border-2 border-gray-600 hover:border-blue-500 transition-colors">
              <h3 className="text-base font-bold text-blue-400 mb-2">🕹️ Navigator</h3>
              <p className="text-xs text-gray-300 mb-2">
                Control movement
              </p>
              <ul className="text-xs text-gray-400 mb-3 space-y-1">
                <li>• Move blue dot</li>
                <li>• Limited vision</li>
                <li>• Follow directions</li>
              </ul>
              <button
                onClick={() => setCreatorRole('navigator')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-2 rounded-lg transition-colors text-sm"
              >
                I'll Navigate!
              </button>
            </div>

            {/* Guide Role */}
            <div className="bg-gray-800 rounded-lg p-3 border-2 border-gray-600 hover:border-green-500 transition-colors">
              <h3 className="text-base font-bold text-green-400 mb-2">🗺️ Guide</h3>
              <p className="text-xs text-gray-300 mb-2">
                Give directions
              </p>
              <ul className="text-xs text-gray-400 mb-3 space-y-1">
                <li>• See full maze</li>
                <li>• Watch Navigator</li>
                <li>• Give directions</li>
              </ul>
              <button
                onClick={() => setCreatorRole('guide')}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-2 rounded-lg transition-colors text-sm"
              >
                I'll Guide!
              </button>
            </div>
          </div>

            <button
              onClick={() => restart()}
              className="text-gray-400 hover:text-white transition-colors underline text-sm"
            >
              ← Back to Main Menu
            </button>
          </div>
        );
      }
    } else {
      // Non-creator waits for role assignment or shows assigned role
      if (playerRole) {
        // Role has been assigned, show confirmation
        return (
          <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">🎭</div>
              <h2 className="text-2xl font-bold mb-4 text-green-400">Role Assigned!</h2>
              <div className="bg-green-900 bg-opacity-30 border border-green-600 rounded-lg p-4 mb-4 max-w-md">
                <p className="text-lg text-green-200 mb-2">
                  <strong>You are the {playerRole === 'navigator' ? '🕹️ Navigator' : '🗺️ Guide'}!</strong>
                </p>
                <p className="text-sm text-green-300">
                  {playerRole === 'navigator' 
                    ? 'Control movement with limited visibility. Follow your guide\'s directions!'
                    : 'You can see the full maze. Help guide the Navigator to the exit!'
                  }
                </p>
              </div>
              {bothPlayersConfirmedReady ? (
                <>
                  <div className="text-2xl mb-2">🚀</div>
                  <p className="text-lg text-gray-300 mb-2">
                    Both players ready! Starting game...
                  </p>
                  <p className="text-sm text-gray-400">
                    Game starting in moments
                  </p>
                </>
              ) : (
                <>
                  <div className="text-2xl mb-2">✅</div>
                  <p className="text-lg text-gray-300 mb-2">
                    Role confirmed! Waiting for partner...
                  </p>
                  <p className="text-sm text-gray-400">
                    Game will start when both players are ready
                  </p>
                </>
              )}
              <div className="animate-pulse mt-2">
                <div className="flex justify-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        );
      } else {
        // Still waiting for role assignment
        return (
          <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">⏳</div>
              <h2 className="text-2xl font-bold mb-2 text-yellow-400">Waiting for Role Assignment</h2>
              <p className="text-md text-gray-300 mb-4">
                The room creator is choosing roles...
              </p>
              <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg p-3 mb-4 max-w-md">
                <p className="text-sm text-yellow-200">
                  🎭 <strong>Your partner will assign your role</strong><br/>
                  You'll automatically start once roles are chosen
                </p>
              </div>
            </div>
            
            <div className="animate-pulse">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              </div>
            </div>

            <button
              onClick={() => restart()}
              className="mt-6 text-gray-400 hover:text-white transition-colors underline text-sm"
            >
              ← Back to Main Menu
            </button>
          </div>
        );
      }
    }
  }

  if (phase === "level-complete") {
    if (isCreator) {
      // Creator controls next level and role switching
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold mb-4 text-green-400">
              Level {currentLevel} Complete!
            </h2>
            <p className="text-lg text-gray-300 mb-2">
              🎯 Both Navigator and Guide succeeded!
            </p>
            <p className="text-md text-green-300 mb-4">
              Great teamwork! You've escaped the maze together!
            </p>
            <div className="bg-green-900 bg-opacity-30 border border-green-600 rounded-lg p-4 mb-4 max-w-md">
              <p className="text-green-200 text-sm">
                ✨ <strong>Navigator:</strong> Great navigation skills!<br />
                🗺️ <strong>Guide:</strong> Excellent directions!
              </p>
            </div>
            <div className="bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg p-3 mb-6 max-w-md">
              <p className="text-xs text-blue-200">
                👑 <strong>You control the next level</strong><br/>
                Choose to continue or switch roles
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleNextLevel}
              className="w-64 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors shadow-lg"
            >
              🚀 Next Level (Same Roles)
            </button>
            
            <button
              onClick={async () => {
                await switchRoles();
                handleNextLevel();
              }}
              className="w-64 bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors shadow-lg"
            >
              🔄 Switch Roles & Next Level
            </button>
            
            <button
              onClick={handleRestartGame}
              className="w-64 bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors"
            >
              🏠 Restart Game
            </button>
          </div>
        </div>
      );
    } else {
      // Non-creator waits for creator's decision
      return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold mb-4 text-green-400">
              Level {currentLevel} Complete!
            </h2>
            <p className="text-lg text-gray-300 mb-2">
              🎯 Both Navigator and Guide succeeded!
            </p>
            <p className="text-md text-green-300 mb-4">
              Great teamwork! You've escaped the maze together!
            </p>
            <div className="bg-green-900 bg-opacity-30 border border-green-600 rounded-lg p-4 mb-4 max-w-md">
              <p className="text-green-200 text-sm">
                ✨ <strong>Navigator:</strong> Great navigation skills!<br />
                🗺️ <strong>Guide:</strong> Excellent directions!
              </p>
            </div>
            
            <div className="text-center mb-6">
              <div className="text-4xl mb-4">⏳</div>
              <h3 className="text-xl font-bold mb-2 text-yellow-400">Waiting for Next Level</h3>
              <p className="text-md text-gray-300 mb-4">
                The room creator is deciding what's next...
              </p>
              <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg p-3 mb-4 max-w-md">
                <p className="text-sm text-yellow-200">
                  🎮 <strong>Your partner will choose:</strong><br/>
                  • Continue to next level<br/>
                  • Switch your roles<br/>
                  • Restart the game
                </p>
              </div>
            </div>
            
            <div className="animate-pulse">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  if (phase === "ended") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4 text-green-400">
            🎉 Game Complete!
          </h2>
          <p className="text-lg text-gray-300 mb-4">
            Thanks for playing!
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleRestartGame}
            className="w-64 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <MazeCanvas />
      <TouchControls />
      <GameUI />
    </div>
  );
}

import { useState, useEffect, useRef } from "react"

export default function App() {
  // ==========================================
  // 1. 音效機制 (Ref 封裝防止記憶體洩漏與 SSR 報錯)
  // ==========================================
  const clickSoundRef = useRef(null)
  const countdownSoundRef = useRef(null)
  const hitSoundRef = useRef(null)
  const winSoundRef = useRef(null)
  const loseSoundRef = useRef(null)
  const bgmSoundRef = useRef(null)

  useEffect(() => {
    clickSoundRef.current = new Audio("/sounds/click.mp3")
    countdownSoundRef.current = new Audio("/sounds/countdown.mp3")
    hitSoundRef.current = new Audio("/sounds/hit.mp3")
    winSoundRef.current = new Audio("/sounds/win.mp3")
    loseSoundRef.current = new Audio("/sounds/lose.mp3")
    
    const bgm = new Audio("/sounds/bgm.mp3")
    bgm.volume = 0.25
    bgmSoundRef.current = bgm
  }, [])

  const playSound = (soundRef, resetTime = false) => {
    const sound = soundRef.current
    if (sound) {
      if (resetTime) sound.currentTime = 0
      sound.play().catch(() => {})
    }
  }

  // ==========================================
  // 2. 遊戲常數與設定
  // ==========================================
  const cards = ["石頭", "剪刀", "布"]

  const characters = {
    fire: { name: "火焰英雄", idle: "/fire_idle.png", punch: "/fire_punch.png", attack: "/fire_attack.png", hit: "/fire_hit.png", win: "/fire_win.png", lose: "/fire_lose.png" },
    water: { name: "水元素英雄", idle: "/water_idle.png", punch: "/water_punch.png", attack: "/water_attack.png", hit: "/water_hit.png", win: "/water_win.png", lose: "/water_lose.png" },
    tiger: { name: "雷電虎戰士", idle: "/tiger_idle.png", punch: "/tiger_punch.png", attack: "/tiger_attack.png", hit: "/tiger_hit.png", win: "/tiger_win.png", lose: "/tiger_lose.png" }
  }

  // ==========================================
  // 3. 核心狀態管理 (State)
  // ==========================================
  const [phase, setPhase] = useState("start") // start, selectPlayer, selectEnemy, pick, finalPick, countdownBattle, battleShow, result
  const [playerCharacter, setPlayerCharacter] = useState("fire")
  const [enemyCharacter, setEnemyCharacter] = useState("tiger")
  const [playerState, setPlayerState] = useState("idle")
  const [enemyState, setEnemyState] = useState("idle")
  
  const [leftHearts, setLeftHearts] = useState(3)
  const [rightHearts, setRightHearts] = useState(3)
  
  const [leftPunch, setLeftPunch] = useState("")
  const [rightPunch, setRightPunch] = useState("")
  const [enemyLeftPunch, setEnemyLeftPunch] = useState("")
  const [enemyRightPunch, setEnemyRightPunch] = useState("")
  const [finalPlayerPunch, setFinalPlayerPunch] = useState("")
  const [finalEnemyPunch, setFinalEnemyPunch] = useState("")
  
  const [decisionCountdown, setDecisionCountdown] = useState(5)
  const [countdown, setCountdown] = useState(3)
  const [resultText, setResultText] = useState("")
  const [gameOver, setGameOver] = useState(false)
  const [winnerSide, setWinnerSide] = useState("")
  
  const [hitShake, setHitShake] = useState(false)
  const [battleFreeze, setBattleFreeze] = useState(false)
  const [flashColor, setFlashColor] = useState("transparent")

  // ==========================================
  // 4. 工具函式 (Helper Functions)
  // ==========================================
  const getCardEmoji = (card) => {
    if (card === "石頭") return "✊"
    if (card === "剪刀") return "✌️"
    return "✋"
  }

  const renderHearts = (count) => {
    return Array.from({ length: count }).map((_, i) => (
      <span key={i} style={{ fontSize: "20px", animation: count === 1 ? "heartPulse 0.7s infinite" : "none" }}>❤️</span>
    ))
  }

  const generateEnemyPunches = () => {
    const left = cards[Math.floor(Math.random() * 3)]
    const right = cards[Math.floor(Math.random() * 3)]
    setEnemyLeftPunch(left)
    setEnemyRightPunch(right)
  }

  const getEnemyFinalPunch = () => {
    const options = [enemyLeftPunch, enemyRightPunch]
    return options[Math.floor(Math.random() * options.length)]
  }

  const judgeBattle = (player, enemy) => {
    if (player === enemy) return "draw"
    if (
      (player === "石頭" && enemy === "剪刀") ||
      (player === "剪刀" && enemy === "布") ||
      (player === "布" && enemy === "石頭")
    ) {
      return "win"
    }
    return "lose"
  }

  const triggerFlash = (color) => {
    setFlashColor(color)
    setTimeout(() => setFlashColor("transparent"), 180)
  }

  // ==========================================
  // 5. 戰鬥核心邏輯計時器 (Effects)
  // ==========================================
  
  // 階段四：選左右拳的倒數
  useEffect(() => {
    if (phase !== "pick") return

    if (decisionCountdown <= 0) {
      const random1 = cards[Math.floor(Math.random() * 3)]
      const random2 = cards[Math.floor(Math.random() * 3)]
      setLeftPunch(leftPunch || random1)
      setRightPunch(rightPunch || random2)
      
      // 自動選好後，立刻進入階段五：公開雙拳
      generateEnemyPunches()
      setPhase("finalPick")
      return
    }

    const timer = setTimeout(() => {
      playSound(countdownSoundRef, true)
      setDecisionCountdown(prev => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [decisionCountdown, phase])

  // 階段七：全螢幕戰鬥演出動效控制
  const startBattleAnimation = (playerPunchCard) => {
    setFinalPlayerPunch(playerPunchCard)
    setPhase("countdownBattle") // 進入全螢幕戰鬥特寫
    setCountdown(3)
  }

  useEffect(() => {
    if (phase !== "countdownBattle") return

    if (countdown <= 0) {
      // 倒數結束，秀出決戰點擊演出
      const enemyFinal = getEnemyFinalPunch()
      setFinalEnemyPunch(enemyFinal)
      const result = judgeBattle(finalPlayerPunch, enemyFinal)
      
      setPlayerState("punch")
      setEnemyState("punch")
      setPhase("battleShow")

      setTimeout(() => {
        playSound(hitSoundRef, true)
        setBattleFreeze(true)

        setTimeout(() => {
          setBattleFreeze(false)
          setWinnerSide(result)
          setHitShake(true)

          if (result === "draw") {
            triggerFlash("white")
            setPlayerState("hit")
            setEnemyState("hit")
            const newLeft = Math.max(leftHearts - 1, 0)
            const newRight = Math.max(rightHearts - 1, 0)
            setLeftHearts(newLeft)
            setRightHearts(newRight)
            setResultText("平手！雙方扣血")
          } else if (result === "win") {
            triggerFlash("#ffd000")
            setPlayerState("attack")
            setEnemyState("hit")
            const newRight = Math.max(rightHearts - 1, 0)
            setRightHearts(newRight)
            setResultText("你贏了！")
          } else {
            triggerFlash("#ff3030")
            setPlayerState("hit")
            setEnemyState("attack")
            const newLeft = Math.max(leftHearts - 1, 0)
            setLeftHearts(newLeft)
            setResultText("你輸了！")
          }

          setTimeout(() => {
            setHitShake(false)
            setWinnerSide("")
            
            // 檢查是否結束遊戲，否則進入最後結果結算畫面
            if (leftHearts - (result === "draw" || result === "lose" ? 1 : 0) <= 0 || 
                rightHearts - (result === "draw" || result === "win" ? 1 : 0) <= 0) {
              setGameOver(true)
              if (leftHearts - (result === "draw" || result === "lose" ? 1 : 0) <= 0) {
                playSound(loseSoundRef, true)
                setPlayerState("lose")
                setEnemyState("win")
              } else {
                playSound(winSoundRef, true)
                setPlayerState("win")
                setEnemyState("lose")
              }
            }
            setPhase("result")
          }, 1500)

        }, 150)
      }, 500)
      return
    }

    const timer = setTimeout(() => {
      playSound(countdownSoundRef, true)
      setCountdown(prev => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, phase])

  // ==========================================
  // 6. 動作控制
  // ==========================================
  const handlePlayerSelect = (key) => {
    playSound(clickSoundRef, true)
    setPlayerCharacter(key)
    setPhase("selectEnemy")
  }

  const handleEnemySelect = (key) => {
    playSound(clickSoundRef, true)
    setEnemyCharacter(key)
    setDecisionCountdown(5)
    setPhase("pick")
  }

  const nextRound = () => {
    setLeftPunch("")
    setRightPunch("")
    setEnemyLeftPunch("")
    setEnemyRightPunch("")
    setFinalPlayerPunch("")
    setFinalEnemyPunch("")
    setPlayerState("idle")
    setEnemyState("idle")
    setDecisionCountdown(5)
    setPhase("pick")
  }

  const restartGame = () => {
    setLeftHearts(3)
    setRightHearts(3)
    setLeftPunch("")
    setRightPunch("")
    setEnemyLeftPunch("")
    setEnemyRightPunch("")
    setFinalPlayerPunch("")
    setFinalEnemyPunch("")
    setPlayerState("idle")
    setEnemyState("idle")
    setGameOver(false)
    setPhase("start")
  }

  // ==========================================
  // 7. 畫面渲染區域 (手機獨立 Screen UI 結構)
  // ==========================================
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #111827, #000)",
        color: "white",
        overflow: "hidden",
        fontFamily: "sans-serif",
        position: "relative",
        boxSizing: "border-box"
      }}
    >
      {/* 全域特效樣式 */}
      <style>
        {`
          @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
          @keyframes heartPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.2); } }
          @keyframes flashHit { 0% { opacity: 0; } 50% { opacity: 0.5; } 100% { opacity: 0; } }
        `}
      </style>

      {/* 受擊閃爍遮罩 */}
      <div style={{ position: "fixed", inset: 0, background: flashColor, opacity: 0.4, pointerEvents: "none", transition: "0.15s", zIndex: 99 }} />

      {/* 一、開始畫面 (Start Screen) */}
      {phase === "start" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", height: "100vh", padding: "60px 20px" }}>
          <div style={{ fontSize: "56px", fontWeight: "900", color: "#ffd000", textAlign: "center", marginTop: "20px", letterSpacing: "2px", textShadow: "0 4px 10px rgba(0,0,0,0.5)" }}>
            雙拳大戰
          </div>
          <img src={characters[playerCharacter].idle} style={{ width: "240px", animation: "float 2s ease-in-out infinite" }} alt="cover" />
          <button
            onClick={() => { playSound(clickSoundRef, true); playSound(bgmSoundRef); setPhase("selectPlayer"); }}
            style={{ padding: "18px 60px", borderRadius: "999px", border: "none", background: "#ff4d4d", color: "white", fontSize: "26px", fontWeight: "900", cursor: "pointer", boxShadow: "0 6px 20px rgba(255,77,77,0.4)" }}
          >
            開始遊戲
          </button>
        </div>
      )}

      {/* 二、選玩家角色 (Select Player Screen) */}
      {phase === "selectPlayer" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", padding: "20px" }}>
          <div style={{ fontSize: "26px", fontWeight: "900", marginBottom: "40px", color: "#ffd000" }}>選擇你的角色</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", width: "100%", maxWidth: "300px" }}>
            {Object.keys(characters).map(key => (
              <div
                key={key}
                onClick={() => handlePlayerSelect(key)}
                style={{ background: "rgba(255,255,255,0.05)", border: "2px solid #444", padding: "15px", borderRadius: "16px", textAlign: "center", cursor: "pointer" }}
              >
                <img src={characters[key].idle} style={{ width: "80px", height: "80px", objectFit: "contain" }} alt={key} />
                <div style={{ marginTop: "10px", fontSize: "14px", fontWeight: "900" }}>{characters[key].name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 三、選敵人角色 (Select Enemy Screen) */}
      {phase === "selectEnemy" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", padding: "20px" }}>
          <div style={{ fontSize: "26px", fontWeight: "900", marginBottom: "40px", color: "#ff4d4d" }}>選擇對手角色</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", width: "100%", maxWidth: "300px" }}>
            {Object.keys(characters).map(key => (
              <div
                key={key}
                onClick={() => handleEnemySelect(key)}
                style={{ background: "rgba(255,255,255,0.05)", border: "2px solid #444", padding: "15px", borderRadius: "16px", textAlign: "center", cursor: "pointer" }}
              >
                <img src={characters[key].idle} style={{ width: "80px", height: "80px", objectFit: "contain" }} alt={key} />
                <div style={{ marginTop: "10px", fontSize: "14px", fontWeight: "900" }}>{characters[key].name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 四、選左右拳階段 (Pick Screen - 敵人完全消失，只留玩家與出拳控制) */}
      {phase === "pick" && (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", justifyContent: "space-between", padding: "30px 20px" }}>
          {/* 上方：血量與倒數 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>{renderHearts(leftHearts)}</div>
            <div style={{ fontSize: "50px", fontWeight: "900", color: "#ffd000" }}>{decisionCountdown}</div>
          </div>
          {/* 中方：僅顯示玩家角色特寫 */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flex: 1 }}>
            <img src={characters[playerCharacter].idle} style={{ width: "180px", animation: "float 2s ease-in-out infinite" }} alt="player" />
          </div>
          {/* 下方：精簡版左右拳選擇區 */}
          <div style={{ background: "rgba(255,255,255,0.02)", padding: "15px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
            {["左拳", "右拳"].map((side, sIdx) => {
              const currentPunch = side === "左拳" ? leftPunch : rightPunch;
              return (
                <div key={side} style={{ marginBottom: sIdx === 0 ? "15px" : "0" }}>
                  <div style={{ fontSize: "13px", color: "#888", marginBottom: "6px", textAlign: "center" }}>{side}</div>
                  <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                    {cards.map(card => {
                      const isSelected = currentPunch === card;
                      return (
                        <div
                          key={card}
                          onClick={() => { playSound(clickSoundRef, true); side === "左拳" ? setLeftPunch(card) : setRightPunch(card); }}
                          style={{
                            width: "80px", height: "55px", background: isSelected ? "linear-gradient(to bottom, #ffd000, #b39200)" : "#222",
                            borderRadius: "12px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
                            cursor: "pointer", border: isSelected ? "2px solid white" : "2px solid #444", transition: "0.2s", color: isSelected ? "black" : "white"
                          }}
                        >
                          <span style={{ fontSize: "22px" }}>{getCardEmoji(card)}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            {/* 雙拳皆選好後的確認出擊鈕 */}
            {leftPunch && rightPunch && (
              <button
                onClick={() => { playSound(clickSoundRef, true); generateEnemyPunches(); setPhase("finalPick"); }}
                style={{ width: "100%", marginTop: "15px", padding: "12px", background: "#00c96b", border: "none", borderRadius: "12px", color: "white", fontSize: "16px", fontWeight: "900" }}
              >
                選好了，公開揭曉！
              </button>
            )}
          </div>
        </div>
      )}

      {/* 五、公開雙拳 + 六、最終選拳 (Final Pick Screen - 上下對峙，雙方二選一決戰) */}
      {phase === "finalPick" && (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", justifyContent: "space-between", padding: "25px 20px" }}>
          {/* 敵方持有卡展示 (上) */}
          <div style={{ textAlign: "center", marginTop: "10px" }}>
            <div style={{ fontSize: "14px", color: "#ff4d4d", marginBottom: "8px" }}>對手的預備雙拳</div>
            <div style={{ display: "flex", justifyContent: "center", gap: "15px" }}>
              <div style={{ width: "75px", height: "100px", background: "#1f2937", border: "2px solid #ff4d4d", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px" }}>{getCardEmoji(enemyLeftPunch)}</div>
              <div style={{ width: "75px", height: "100px", background: "#1f2937", border: "2px solid #ff4d4d", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px" }}>{getCardEmoji(enemyRightPunch)}</div>
            </div>
          </div>

          {/* 中間對立分界線 */}
          <div style={{ textAlign: "center", margin: "20px 0" }}>
            <div style={{ fontSize: "20px", fontWeight: "900", color: "#aaa", trackingLetter: "4px" }}>VS</div>
            <div style={{ fontSize: "15px", color: "#ffd000", marginTop: "10px", fontWeight: "900" }}>請點擊選擇下方一張作為「最終出拳」</div>
          </div>

          {/* 玩家最終抉擇卡片放置區 (下) */}
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: "25px" }}>
              {[leftPunch, rightPunch].map((card, idx) => (
                <div
                  key={idx}
                  onClick={() => startBattleAnimation(card)}
                  style={{
                    width: "110px", height: "150px", borderRadius: "16px", background: "linear-gradient(to bottom, #333, #111)",
                    border: "3px solid #ffd000", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
                    cursor: "pointer", boxShadow: "0 8px 20px rgba(0,0,0,0.6)", transform: "scale(1)", transition: "0.2s"
                  }}
                >
                  <div style={{ fontSize: "44px" }}>{getCardEmoji(card)}</div>
                  <div style={{ marginTop: "10px", fontSize: "14px", fontWeight: "900", color: "#ffd000" }}>{card}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: "13px", color: "#666", marginTop: "12px" }}>你的左拳與右拳</div>
          </div>
        </div>
      )}

      {/* 七、全螢幕戰鬥演出畫面 (CountdownBattle & BattleShow - 零 UI，純動畫展示) */}
      {(phase === "countdownBattle" || phase === "battleShow") && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "#0b0f17", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "40px 0" }}>
          {/* 倒數大文字 */}
          {phase === "countdownBattle" && (
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: "120px", fontWeight: "900", color: "#ff4d4d", zIndex: 10 }}>
              {countdown}
            </div>
          )}

          {/* 敵方角色特寫(上) */}
          <div style={{ display: "flex", justifyContent: "center", width: "100%", transform: "scaleX(-1)" }}>
            <img
              src={getCharacterImage(enemyCharacter, enemyState)}
              style={{
                width: "240px", height: "240px", objectFit: "contain",
                transform: battleFreeze ? "scale(1.2)" : hitShake && winnerSide === "win" ? "translateY(40px)" : "none",
                filter: winnerSide === "lose" ? "drop-shadow(0 0 40px #ff3030)" : "none", transition: "0.15s"
              }}
              alt="enemy-anim"
            />
          </div>

          {/* 出拳對撞特寫中間層 */}
          {phase === "battleShow" && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "30px", fontSize: "56px", zIndex: 5, animation: "heartPulse 0.3s infinite" }}>
              <span>{getCardEmoji(finalPlayerPunch)}</span>
              <span style={{ fontSize: "24px", color: "#ff4d4d", fontWeight: "900" }}>VS</span>
              <span>{getCardEmoji(finalEnemyPunch)}</span>
            </div>
          )}

          {/* 玩家角色特寫(下) */}
          <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
            <img
              src={getCharacterImage(playerCharacter, playerState)}
              style={{
                width: "240px", height: "240px", objectFit: "contain",
                transform: battleFreeze ? "scale(1.2)" : hitShake && winnerSide === "lose" ? "translateY(-40px)" : "none",
                filter: winnerSide === "win" ? "drop-shadow(0 0 40px #ffd000)" : "none", transition: "0.15s"
              }}
              alt="player-anim"
            />
          </div>
        </div>
      )}

      {/* 八、結果清算畫面 (Result Screen - 全螢幕大字結算，分段呈現) */}
      {phase === "result" && (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", justifyContent: "space-between", alignItems: "center", padding: "60px 20px", textAlign: "center" }}>
          
          {/* 血量狀態回歸統計 */}
          <div style={{ display: "flex", width: "100%", justifyContent: "space-between", padding: "0 10px" }}>
            <div><div style={{ fontSize: "12px", color: "#888" }}>玩家血量</div>{renderHearts(leftHearts)}</div>
            <div><div style={{ fontSize: "12px", color: "#888" }}>電腦血量</div>{renderHearts(rightHearts)}</div>
          </div>

          {/* 勝負主控大字 */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
            {!gameOver ? (
              <>
                <div style={{ fontSize: "46px", fontWeight: "900", color: winnerSide === "win" ? "#ffd000" : winnerSide === "lose" ? "#ff3030" : "#fff" }}>
                  {resultText}
                </div>
                <div style={{ fontSize: "20px", marginTop: "15px", color: "#aaa" }}>
                  {getCardEmoji(finalPlayerPunch)} 戰 {getCardEmoji(finalEnemyPunch)}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: "64px", fontWeight: "900", color: "#ffd000", letterSpacing: "2px" }}>GAME OVER</div>
                <div style={{ fontSize: "32px", marginTop: "20px", fontWeight: "900" }}>
                  {leftHearts <= 0 ? "最終戰敗 ❌" : "傳奇大勝 🎉"}
                </div>
              </>
            )}
          </div>

          {/* 下一步動作控鈕 */}
          <div style={{ width: "100%", display: "flex", justifyContent: "center", marginBottom: "20px" }}>
            {!gameOver ? (
              <button
                onClick={nextRound}
                style={{ padding: "16px 60px", borderRadius: "999px", border: "none", background: "#00c96b", color: "white", fontSize: "22px", fontWeight: "900", cursor: "pointer", boxShadow: "0 4px 15px rgba(0,201,107,0.3)" }}
              >
                下一回合
              </button>
            ) : (
              <button
                onClick={restartGame}
                style={{ padding: "16px 60px", borderRadius: "999px", border: "none", background: "#ff4d4d", color: "white", fontSize: "22px", fontWeight: "900", cursor: "pointer", boxShadow: "0 4px 15px rgba(255,77,77,0.3)" }}
              >
                再玩一次
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
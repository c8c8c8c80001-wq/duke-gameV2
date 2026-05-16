import { useState, useEffect, useRef } from "react"

export default function App() {
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

  const cards = ["石頭", "剪刀", "布"]

  const characters = {
    fire: {
      name: "火焰英雄",
      idle: "/fire_idle.png",
      punch: "/fire_punch.png",
      attack: "/fire_attack.png",
      hit: "/fire_hit.png",
      win: "/fire_win.png",
      lose: "/fire_lose.png"
    },
    water: {
      name: "水元素英雄",
      idle: "/water_idle.png",
      punch: "/water_punch.png",
      attack: "/water_attack.png",
      hit: "/water_hit.png",
      win: "/water_win.png",
      lose: "/water_lose.png"
    },
    tiger: {
      name: "雷電虎戰士",
      idle: "/tiger_idle.png",
      punch: "/tiger_punch.png",
      attack: "/tiger_attack.png",
      hit: "/tiger_hit.png",
      win: "/tiger_win.png",
      lose: "/tiger_lose.png"
    }
  }

  const [phase, setPhase] = useState("start")
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
  const [resultText, setResultText] = useState("按開始遊戲")
  const [gameOver, setGameOver] = useState(false)
  const [winnerSide, setWinnerSide] = useState("")
  const [hitShake, setHitShake] = useState(false)
  const [battleFreeze, setBattleFreeze] = useState(false)
  const [flashColor, setFlashColor] = useState("transparent")

  const getCardEmoji = (card) => {
    if (card === "石頭") return "✊"
    if (card === "剪刀") return "✌️"
    return "✋"
  }

  const getCharacterImage = (character, state) => {
    return characters[character][state]
  }

  const renderHearts = (count) => {
    return Array.from({ length: count }).map((_, i) => (
      <span
        key={i}
        style={{
          fontSize: "20px",
          animation: count === 1 ? "heartPulse 0.7s infinite" : "none"
        }}
      >
        ❤️
      </span>
    ))
  }

  const cardStyle = (selected) => ({
    width: "90px",
    height: "125px",
    borderRadius: "16px",
    background: "linear-gradient(to bottom, #444, #111)",
    border: "3px solid white",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    transform: selected ? "scale(1.1) translateY(-8px)" : "scale(1)",
    boxShadow: selected ? "0 0 25px #ffd000" : "none",
    transition: "0.2s"
  })

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
    setTimeout(() => {
      setFlashColor("transparent")
    }, 180)
  }

  const triggerHitEffect = (side) => {
    setBattleFreeze(true)
    setTimeout(() => {
      setBattleFreeze(false)
      setWinnerSide(side)
      setHitShake(true)
      setTimeout(() => {
        setHitShake(false)
        setWinnerSide("")
      }, 1500)
    }, 150)
  }

  useEffect(() => {
    if (phase !== "pick" && phase !== "finalPick") return

    if (decisionCountdown <= 0) {
      if (phase === "pick") {
        const random1 = cards[Math.floor(Math.random() * 3)]
        const random2 = cards[Math.floor(Math.random() * 3)]
        setLeftPunch(leftPunch || random1)
        setRightPunch(rightPunch || random2)
        setTimeout(() => {
          setCountdown(3)
          setResultText("3秒後公開雙拳")
          setPhase("countdownReveal")
        }, 500)
      }
      if (phase === "finalPick") {
        const autoPunch = leftPunch || rightPunch
        chooseFinalPunch(autoPunch)
      }
      return
    }

    const timer = setTimeout(() => {
      playSound(countdownSoundRef, true)
      setDecisionCountdown(prev => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [decisionCountdown, phase])

  useEffect(() => {
    if (phase !== "countdownReveal" && phase !== "countdownBattle") return

    if (countdown <= 0) {
      if (phase === "countdownReveal") {
        generateEnemyPunches()
        setDecisionCountdown(5)
        setResultText("選擇最終拳")
        setPhase("finalPick")
      }

      if (phase === "countdownBattle") {
        const enemyFinal = getEnemyFinalPunch()
        setFinalEnemyPunch(enemyFinal)

        const result = judgeBattle(finalPlayerPunch, enemyFinal)

        playSound(hitSoundRef, true)
        triggerHitEffect(result)

        if (result === "draw") {
          triggerFlash("white")
          setPlayerState("hit")
          setEnemyState("hit")

          const newLeft = Math.max(leftHearts - 1, 0)
          const newRight = Math.max(rightHearts - 1, 0)
          setLeftHearts(newLeft)
          setRightHearts(newRight)
          setResultText("平手！雙方扣血")

          if (newLeft <= 0 || newRight <= 0) {
            if (newLeft <= 0) {
              playSound(loseSoundRef, true)
              setPlayerState("lose")
              setEnemyState("win")
            } else {
              playSound(winSoundRef, true)
              setPlayerState("win")
              setEnemyState("lose")
            }
            setGameOver(true)
          } else {
            setTimeout(() => {
              setPlayerState("idle")
              setEnemyState("idle")
            }, 2200)
          }
        } else if (result === "win") {
          triggerFlash("#ffd000")
          setPlayerState("attack")
          setEnemyState("hit")

          const newRight = Math.max(rightHearts - 1, 0)
          setRightHearts(newRight)
          setResultText("你贏了！")

          if (newRight <= 0) {
            setPlayerState("win")
            setEnemyState("lose")
            setGameOver(true)
          } else {
            setTimeout(() => {
              setPlayerState("idle")
              setEnemyState("idle")
            }, 2200)
          }
        } else {
          triggerFlash("#ff3030")
          setPlayerState("hit")
          setEnemyState("attack")

          const newLeft = Math.max(leftHearts - 1, 0)
          setLeftHearts(newLeft)
          setResultText("你輸了！")

          if (newLeft <= 0) {
            setPlayerState("lose")
            setEnemyState("win")
            setGameOver(true)
          } else {
            setTimeout(() => {
              setPlayerState("idle")
              setEnemyState("idle")
            }, 2200)
          }
        }
        setPhase("result")
      }
      return
    }

    const timer = setTimeout(() => {
      playSound(countdownSoundRef, true)
      setCountdown(prev => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, phase, finalPlayerPunch])

  const chooseFinalPunch = (card) => {
    playSound(clickSoundRef, true)
    setFinalPlayerPunch(card)
    setPlayerState("punch")
    setEnemyState("punch")
    setCountdown(3)
    setResultText("最終出拳倒數")
    setPhase("countdownBattle")
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
    setResultText("請選擇左右拳")
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
    setResultText("按開始遊戲")
    setPhase("start")
  }

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "linear-gradient(to bottom, #111827, #000)",
        color: "white",
        overflowX: "hidden",
        fontFamily: "sans-serif",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        boxSizing: "border-box"
      }}
    >
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
            100% { transform: translateY(0px); }
          }
          @keyframes heartPulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.2); }
            100% { transform: scale(1); }
          }
        `}
      </style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          background: flashColor,
          opacity: 0.35,
          pointerEvents: "none",
          transition: "0.15s",
          zIndex: 99
        }}
      />

      {/* 頂部血條UI */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "15px 20px",
          background: "rgba(0,0,0,0.4)"
        }}
      >
        <div>
          <div style={{ fontSize: "15px", fontWeight: "900" }}>玩家</div>
          <div style={{ marginTop: "4px" }}>{renderHearts(leftHearts)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "15px", fontWeight: "900" }}>電腦</div>
          <div style={{ marginTop: "4px" }}>{renderHearts(rightHearts)}</div>
        </div>
      </div>

      {/* 中部對戰區域：角色放左右，倒數放角色中間 */}
      <div
        style={{
          flex: "1",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          width: "100%",
          minHeight: "260px",
          padding: "0 10px",
          boxSizing: "border-box"
        }}
      >
        {/* 玩家角色（左側） */}
        <div style={{ width: "38%", display: "flex", justifyContent: "center", zIndex: 2 }}>
          <img
            src={getCharacterImage(playerCharacter, playerState)}
            style={{
              width: "100%",
              maxHeight: "200px",
              objectFit: "contain",
              animation: playerState === "idle" ? "float 2s ease-in-out infinite" : "none",
              transform: battleFreeze
                ? "scale(1.15)"
                : hitShake && winnerSide === "lose"
                ? "translateX(-20px)"
                : winnerSide === "win"
                ? "scale(1.1)"
                : "scale(1)",
              filter: winnerSide === "win" ? "drop-shadow(0 0 30px #ffd000)" : "none",
              transition: "0.25s"
            }}
            alt="player"
          />
        </div>

        {/* 中央資訊區（倒數與狀態文字放兩者正中間） */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: "24%",
            textAlign: "center",
            zIndex: 5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {/* 倒數數字 */}
          <div
            style={{
              fontSize:
                phase === "pick" ||
                phase === "finalPick" ||
                phase === "countdownReveal" ||
                phase === "countdownBattle"
                  ? "54px"
                  : "30px",
              fontWeight: "900",
              color: "#ffd000",
              textShadow: "0 0 15px rgba(0,0,0,1), 0 0 5px rgba(0,0,0,1)",
              transform: decisionCountdown <= 3 || countdown <= 3 ? "scale(1.15)" : "scale(1)",
              transition: "0.2s",
              lineHeight: "1"
            }}
          >
            {phase === "pick" || phase === "finalPick"
              ? decisionCountdown
              : phase === "countdownReveal" || phase === "countdownBattle"
              ? countdown
              : "⚡"}
          </div>

          {/* 輔助中央小提示文字（配合 resultText 顯示） */}
          <div
            style={{
              fontSize: "12px",
              color: "#aaa",
              marginTop: "4px",
              whiteSpace: "nowrap",
              textShadow: "0 1px 3px #000"
            }}
          >
            {phase === "countdownBattle" ? "BATTLE" : phase === "pick" ? "READY" : ""}
          </div>
        </div>

        {/* 電腦角色（右側，做水平翻轉面向玩家） */}
        <div style={{ width: "38%", display: "flex", justifyContent: "center", zIndex: 2 }}>
          <img
            src={getCharacterImage(enemyCharacter, enemyState)}
            style={{
              width: "100%",
              maxHeight: "200px",
              objectFit: "contain",
              animation: enemyState === "idle" ? "float 2s ease-in-out infinite" : "none",
              transform: battleFreeze
                ? "scale(1.15) scaleX(-1)"
                : hitShake && winnerSide === "win"
                ? "translateX(20px) scaleX(-1)"
                : winnerSide === "lose"
                ? "scale(1.1) scaleX(-1)"
                : "scaleX(-1)",
              filter: winnerSide === "lose" ? "drop-shadow(0 0 30px #ff3030)" : "none",
              transition: "0.25s"
            }}
            alt="enemy"
          />
        </div>
      </div>

      {/* 提示主文字區域（移至中下銜接操作區） */}
      <div
        style={{
          textAlign: "center",
          fontSize: "22px",
          fontWeight: "900",
          padding: "0 15px",
          color: "#fff",
          textShadow: "0 2px 4px rgba(0,0,0,0.5)",
          marginBottom: "10px"
        }}
      >
        {resultText}
      </div>

      {/* 下部操作區域：選擇要出的拳放中下 */}
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: "20px 10px 35px 10px",
          minHeight: "220px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center"
        }}
      >
        {phase === "start" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "40px", fontWeight: "900", color: "#ffd000", marginBottom: "20px" }}>
              雙拳大戰
            </div>
            <button
              onClick={() => {
                playSound(clickSoundRef, true)
                playSound(bgmSoundRef)
                setPhase("selectPlayer")
              }}
              style={{
                padding: "14px 50px",
                borderRadius: "999px",
                border: "none",
                background: "#ff4d4d",
                color: "white",
                fontSize: "22px",
                fontWeight: "900",
                cursor: "pointer"
              }}
            >
              開始遊戲
            </button>
          </div>
        )}

        {phase === "selectPlayer" && (
          <div>
            <div style={{ fontSize: "18px", fontWeight: "900", marginBottom: "15px", textAlign: "center", color: "#aaa" }}>
              選擇你的角色
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
              {Object.keys(characters).map(key => (
                <div
                  key={key}
                  onClick={() => {
                    playSound(clickSoundRef, true)
                    setPlayerCharacter(key)
                    setPhase("selectEnemy")
                  }}
                  style={{ cursor: "pointer", background: "rgba(255,255,255,0.05)", padding: "8px", borderRadius: "12px", width: "85px", textAlign: "center" }}
                >
                  <img src={characters[key].idle} style={{ width: "100%", height: "70px", objectFit: "contain" }} alt={key} />
                  <div style={{ marginTop: "6px", fontSize: "13px", fontWeight: "900" }}>
                    {characters[key].name.replace("英雄", "").replace("戰士", "")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === "selectEnemy" && (
          <div>
            <div style={{ fontSize: "18px", fontWeight: "900", marginBottom: "15px", textAlign: "center", color: "#aaa" }}>
              選擇敵人角色
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
              {Object.keys(characters).map(key => (
                <div
                  key={key}
                  onClick={() => {
                    playSound(clickSoundRef, true)
                    setEnemyCharacter(key)
                    setDecisionCountdown(5)
                    setResultText("請在5秒內選擇左右拳")
                    setPhase("pick")
                  }}
                  style={{ cursor: "pointer", background: "rgba(255,255,255,0.05)", padding: "8px", borderRadius: "12px", width: "85px", textAlign: "center" }}
                >
                  <img src={characters[key].idle} style={{ width: "100%", height: "70px", objectFit: "contain" }} alt={key} />
                  <div style={{ marginTop: "6px", fontSize: "13px", fontWeight: "900" }}>
                    {characters[key].name.replace("英雄", "").replace("戰士", "")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === "pick" && (
          <div style={{ width: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "15px", alignItems: "center" }}>
              {/* 左拳選區 */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "14px", fontWeight: "900", color: "#aaa", width: "35px" }}>左拳:</span>
                <div style={{ display: "flex", gap: "10px" }}>
                  {cards.map(card => (
                    <div
                      key={card}
                      onClick={() => {
                        playSound(clickSoundRef, true)
                        setLeftPunch(card)
                      }}
                      style={cardStyle(leftPunch === card)}
                    >
                      <div style={{ fontSize: "36px" }}>{getCardEmoji(card)}</div>
                      <div style={{ marginTop: "4px", fontSize: "14px", fontWeight: "900" }}>{card}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* 右拳選區 */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "14px", fontWeight: "900", color: "#aaa", width: "35px" }}>右拳:</span>
                <div style={{ display: "flex", gap: "10px" }}>
                  {cards.map(card => (
                    <div
                      key={card}
                      onClick={() => {
                        playSound(clickSoundRef, true)
                        setRightPunch(card)
                      }}
                      style={cardStyle(rightPunch === card)}
                    >
                      <div style={{ fontSize: "36px" }}>{getCardEmoji(card)}</div>
                      <div style={{ marginTop: "4px", fontSize: "14px", fontWeight: "900" }}>{card}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {phase === "finalPick" && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {/* 雙拳公開揭示板 */}
            <div style={{ display: "flex", width: "90%", justifyContent: "space-between", background: "rgba(0,0,0,0.3)", padding: "8px 15px", borderRadius: "10px", marginBottom: "15px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "#888" }}>你:</span>
                <span style={{ fontSize: "22px", marginLeft: "6px" }}>{getCardEmoji(leftPunch)}{getCardEmoji(rightPunch)}</span>
              </div>
              <div>
                <span style={{ fontSize: "12px", color: "#888" }}>敵:</span>
                <span style={{ fontSize: "22px", marginLeft: "6px" }}>{getCardEmoji(enemyLeftPunch)}{getCardEmoji(enemyRightPunch)}</span>
              </div>
            </div>
            {/* 最終決選二擇一按鈕放置中下 */}
            <div style={{ display: "flex", gap: "25px" }}>
              {[leftPunch, rightPunch].map((card, index) => (
                <div
                  key={index}
                  onClick={() => chooseFinalPunch(card)}
                  style={cardStyle(false)}
                >
                  <div style={{ fontSize: "38px" }}>{getCardEmoji(card)}</div>
                  <div style={{ marginTop: "4px", fontSize: "14px", fontWeight: "900" }}>{card}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === "result" && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "42px", fontWeight: "900", display: "flex", justifyContent: "center", alignItems: "center", gap: "15px", marginBottom: "15px" }}>
              <span>{getCardEmoji(finalPlayerPunch)}</span>
              <span style={{ fontSize: "18px", color: "#ff4d4d" }}>VS</span>
              <span>{getCardEmoji(finalEnemyPunch)}</span>
            </div>
            {!gameOver && (
              <button
                onClick={nextRound}
                style={{
                  padding: "12px 45px",
                  borderRadius: "999px",
                  border: "none",
                  background: "#00c96b",
                  color: "white",
                  fontSize: "18px",
                  fontWeight: "900",
                  cursor: "pointer"
                }}
              >
                下一回合
              </button>
            )}
          </div>
        )}

        {gameOver && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "24px", fontWeight: "900", marginBottom: "15px" }}>
              {leftHearts <= 0 ? "你輸了 ❌" : "你贏了 🎉"}
            </div>
            <button
              onClick={restartGame}
              style={{
                padding: "12px 50px",
                borderRadius: "999px",
                border: "none",
                background: "#ff4d4d",
                color: "white",
                fontSize: "18px",
                fontWeight: "900",
                cursor: "pointer"
              }}
            >
              再玩一次
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
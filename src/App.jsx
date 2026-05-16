import { useState, useEffect, useRef } from "react"

export default function App() {
  // 修正點 1：使用 useRef 封裝音效，避免每次 Render 重複創建與 SSR 報錯
  const clickSoundRef = useRef(null)
  const countdownSoundRef = useRef(null)
  const hitSoundRef = useRef(null)
  const winSoundRef = useRef(null)
  const loseSoundRef = useRef(null)
  const bgmSoundRef = useRef(null)

  // 修正點 2：在客戶端組件掛載時才初始化 Audio 物件
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

  // 輔助函式：安全播放音效，防止未載入完成或被瀏覽器阻擋時報錯
  const playSound = (soundRef, resetTime = false) => {
    const sound = soundRef.current
    if (sound) {
      if (resetTime) sound.currentTime = 0
      sound.play().catch(() => {
        // 捕捉瀏覽器因使用者尚未互動而阻擋播放的錯誤，避免程式崩潰
      })
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
          fontSize: "34px",
          animation: count === 1 ? "heartPulse 0.7s infinite" : "none"
        }}
      >
        ❤️
      </span>
    ))
  }

  const cardStyle = (selected) => ({
    width: "120px",
    height: "160px",
    borderRadius: "28px",
    background: "linear-gradient(to bottom, #444, #111)",
    border: "4px solid white",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    transform: selected ? "scale(1.15) translateY(-10px)" : "scale(1)",
    boxShadow: selected ? "0 0 40px #ffd000" : "none",
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
      // 修正點 3：替換為安全播放函式
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

        // 修正點 4：替換為安全播放函式
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
              // 修正點 5：替換為安全播放函式
              playSound(loseSoundRef, true)
              setPlayerState("lose")
              setEnemyState("win")
            } else {
              // 修正點 6：替換為安全播放函式
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
      // 修正點 7：替換為安全播放函式
      playSound(countdownSoundRef, true)
      setCountdown(prev => prev - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [countdown, phase, finalPlayerPunch])

  const chooseFinalPunch = (card) => {
    // 修正點 8：替換為安全播放函式
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
        overflow: "hidden",
        fontFamily: "sans-serif",
        paddingBottom: "50px",
        position: "relative"
      }}
    >
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
          @keyframes heartPulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.25); }
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

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "30px 40px"
        }}
      >
        <div>
          <div style={{ fontSize: "24px", fontWeight: "900" }}>玩家</div>
          <div style={{ marginTop: "10px" }}>{renderHearts(leftHearts)}</div>
        </div>

        <div
          style={{
            fontSize:
              phase === "pick" ||
              phase === "finalPick" ||
              phase === "countdownReveal" ||
              phase === "countdownBattle"
                ? "140px"
                : "60px",
            fontWeight: "900",
            color: "#ffd000",
            transform:
              decisionCountdown <= 3 || countdown <= 3
                ? "scale(1.15)"
                : "scale(1)",
            transition: "0.2s"
          }}
        >
          {phase === "pick" || phase === "finalPick"
            ? decisionCountdown
            : phase === "countdownReveal" || phase === "countdownBattle"
            ? countdown
            : "⚡"}
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "24px", fontWeight: "900" }}>電腦</div>
          <div style={{ marginTop: "10px" }}>{renderHearts(rightHearts)}</div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 50px"
        }}
      >
        <img
          src={getCharacterImage(playerCharacter, playerState)}
          style={{
            width: "320px",
            animation:
              playerState === "idle"
                ? "float 2s ease-in-out infinite"
                : "none",
            transform: battleFreeze
              ? "scale(1.28)"
              : hitShake && winnerSide === "lose"
              ? "translateX(-45px)"
              : winnerSide === "win"
              ? "scale(1.22)"
              : "scale(1)",
            filter:
              winnerSide === "win"
                ? "drop-shadow(0 0 55px #ffd000)"
                : "none",
            transition: "0.28s"
          }}
          alt="player"
        />

        <img
          src={getCharacterImage(enemyCharacter, enemyState)}
          style={{
            width: "320px",
            animation:
              enemyState === "idle" ? "float 2s ease-in-out infinite" : "none",
            transform: battleFreeze
              ? "scale(1.28)"
              : hitShake && winnerSide === "win"
              ? "translateX(45px)"
              : winnerSide === "lose"
              ? "scale(1.22)"
              : "scale(1)",
            filter:
              winnerSide === "lose"
                ? "drop-shadow(0 0 55px #ff3030)"
                : "none",
            transition: "0.28s"
          }}
          alt="enemy"
        />
      </div>

      <div
        style={{
          textAlign: "center",
          marginTop: "20px",
          fontSize: "38px",
          fontWeight: "900"
        }}
      >
        {resultText}
      </div>

      {phase === "start" && (
        <div style={{ textAlign: "center", marginTop: "60px" }}>
          <div style={{ fontSize: "82px", fontWeight: "900", color: "#ffd000" }}>
            雙拳大戰
          </div>
          <button
            onClick={() => {
              // 修正點 9：替換為安全播放函式
              playSound(clickSoundRef, true)
              playSound(bgmSoundRef)
              setPhase("selectPlayer")
            }}
            style={{
              marginTop: "50px",
              padding: "24px 80px",
              borderRadius: "999px",
              border: "none",
              background: "#ff4d4d",
              color: "white",
              fontSize: "36px",
              fontWeight: "900",
              cursor: "pointer"
            }}
          >
            開始遊戲
          </button>
        </div>
      )}

      {phase === "selectPlayer" && (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <div style={{ fontSize: "42px", fontWeight: "900", marginBottom: "40px" }}>
            選擇你的角色
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "40px" }}>
            {Object.keys(characters).map(key => (
              <div
                key={key}
                onClick={() => {
                  // 修正點 10
                  playSound(clickSoundRef, true)
                  setPlayerCharacter(key)
                  setPhase("selectEnemy")
                }}
                style={{ cursor: "pointer" }}
              >
                <img src={characters[key].idle} style={{ width: "220px" }} alt={key} />
                <div style={{ marginTop: "20px", fontSize: "28px", fontWeight: "900" }}>
                  {characters[key].name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === "selectEnemy" && (
        <div style={{ textAlign: "center", marginTop: "50px" }}>
          <div style={{ fontSize: "42px", fontWeight: "900", marginBottom: "40px" }}>
            選擇敵人角色
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "40px" }}>
            {Object.keys(characters).map(key => (
              <div
                key={key}
                onClick={() => {
                  // 修正點 11
                  playSound(clickSoundRef, true)
                  setEnemyCharacter(key)
                  setDecisionCountdown(5)
                  setResultText("請在5秒內選擇左右拳")
                  setPhase("pick")
                }}
                style={{ cursor: "pointer" }}
              >
                <img src={characters[key].idle} style={{ width: "220px" }} alt={key} />
                <div style={{ marginTop: "20px", fontSize: "28px", fontWeight: "900" }}>
                  {characters[key].name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === "pick" && (
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <div style={{ fontSize: "34px", marginBottom: "30px" }}>選擇左拳</div>
          <div style={{ display: "flex", justifyContent: "center", gap: "30px" }}>
            {cards.map(card => (
              <div
                key={card}
                onClick={() => {
                  // 修正點 12
                  playSound(clickSoundRef, true)
                  setLeftPunch(card)
                }}
                style={cardStyle(leftPunch === card)}
              >
                <div style={{ fontSize: "60px" }}>{getCardEmoji(card)}</div>
                <div style={{ marginTop: "10px", fontSize: "24px" }}>{card}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: "34px", margin: "50px 0 30px" }}>選擇右拳</div>
          <div style={{ display: "flex", justifyContent: "center", gap: "30px" }}>
            {cards.map(card => (
              <div
                key={card}
                onClick={() => {
                  // 修正點 13
                  playSound(clickSoundRef, true)
                  setRightPunch(card)
                }}
                style={cardStyle(rightPunch === card)}
              >
                <div style={{ fontSize: "60px" }}>{getCardEmoji(card)}</div>
                <div style={{ marginTop: "10px", fontSize: "24px" }}>{card}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === "finalPick" && (
        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <div style={{ fontSize: "44px", fontWeight: "900" }}>雙方拳種公開</div>
          <div style={{ display: "flex", justifyContent: "space-around", marginTop: "60px" }}>
            <div>
              <div style={{ fontSize: "30px", marginBottom: "20px" }}>你的雙拳</div>
              <div style={{ fontSize: "100px" }}>
                {getCardEmoji(leftPunch)} {getCardEmoji(rightPunch)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "30px", marginBottom: "20px" }}>敵人的雙拳</div>
              <div style={{ fontSize: "100px" }}>
                {getCardEmoji(enemyLeftPunch)} {getCardEmoji(enemyRightPunch)}
              </div>
            </div>
          </div>

          <div style={{ fontSize: "38px", marginTop: "60px", marginBottom: "30px" }}>
            選擇最終拳
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "40px" }}>
            {[leftPunch, rightPunch].map((card, index) => (
              <div
                key={index}
                onClick={() => {
                  chooseFinalPunch(card)
                }}
                style={cardStyle(false)}
              >
                <div style={{ fontSize: "60px" }}>{getCardEmoji(card)}</div>
                <div style={{ marginTop: "10px", fontSize: "24px" }}>{card}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === "result" && (
        <div style={{ textAlign: "center", marginTop: "60px" }}>
          <div style={{ fontSize: "50px", fontWeight: "900" }}>最終出拳</div>
          <div style={{ fontSize: "120px", marginTop: "30px" }}>
            {getCardEmoji(finalPlayerPunch)} VS {getCardEmoji(finalEnemyPunch)}
          </div>
          {!gameOver && (
            <button
              onClick={nextRound}
              style={{
                marginTop: "50px",
                padding: "20px 60px",
                borderRadius: "999px",
                border: "none",
                background: "#00c96b",
                color: "white",
                fontSize: "30px",
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
        <div style={{ textAlign: "center", marginTop: "60px" }}>
          <div style={{ fontSize: "80px", fontWeight: "900", color: "#ffd000" }}>
            GAME OVER
          </div>
          <div style={{ fontSize: "42px", marginTop: "20px" }}>
            {leftHearts <= 0 ? "你輸了" : "你贏了"}
          </div>
          <button
            onClick={restartGame}
            style={{
              marginTop: "50px",
              padding: "22px 60px",
              borderRadius: "999px",
              border: "none",
              background: "#ff4d4d",
              color: "white",
              fontSize: "30px",
              fontWeight: "900",
              cursor: "pointer"
            }}
          >
            再玩一次
          </button>
        </div>
      )}
    </div>
  )
}
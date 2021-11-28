import { useCallback, useEffect, useRef, useState } from "react"
import Peer from "peerjs"
import { WebrtcClientProps } from "types"

/**
 * WebrtcClient Module
 * @class
 * @param props
 * @param host peerjs server host
 * @param port peerjs server port
 * @param server server url ex) http://localhsot:3000
 * @param roomId unique id ex) uuid
 */
function WebrtcClient({ host, port, server, roomId }: WebrtcClientProps) {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [peer, setPeer] = useState<Peer | null>(null)
  const [users, setUsers] = useState([])
  const videoGridRef = useRef<HTMLDivElement>(null)

  /** 비디오 엘리먼트 추가 */
  const addVideoStream = useCallback(
    (video: HTMLVideoElement, stream: MediaStream) => {
      video.srcObject = stream
      video.addEventListener("loadedmetadata", () => {
        video.play()
      })

      console.log(video)
      videoGridRef.current?.append(video)
    },
    []
  )

  /** 새 유저 연결*/
  const connectToNewUser = useCallback(
    (userId: string, stream: MediaStream) => {
      if (!peer) return

      // 2. 상대방 피어에게 요청 (상대방피어 id, 내 stream), mediaConnection 반환
      const call = peer.call(userId, stream)
      const video = document.createElement("video")

      // 4. 상대방 피어가 stream을 추가(수락)했을때 이벤트 리스너

      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream)
      })

      // 나 혹은 상대방이 media connection을 닫을때 이벤트 리스너

      call.on("close", () => {
        video.remove()
      })
    },
    [addVideoStream, peer]
  )

  /** Socket Init */
  useEffect(() => {
    //const socket_ = io("ws://localhost:8080")
    const socket_ = new WebSocket("ws://localhost:8080")
    setSocket(socket_)
  }, [server])

  /** Peer Init */
  useEffect(() => {
    const myPeer = new Peer(undefined, { host, port })
    setPeer(myPeer)
  }, [host, port])

  /** Peer, Socket Chanaged */
  useEffect(() => {
    if (!peer) return
    if (!socket) return

    // 0. peer 서버로 제대로 접속한 경우
    peer.on("open", (id) => {
      console.log("내 아이디 : " + id)
      socket.send(
        JSON.stringify({
          type: "channel",
          roomId,
          id,
        })
      )
    })

    const myVideo = document.createElement("video")
    myVideo.muted = true

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        addVideoStream(myVideo, stream)

        // 3.상대방 피어가 나에게 call을 시도했을때 이벤트리스너
        peer.on("call", (call) => {
          console.log("call")
          call.answer(stream) // 가장 먼저 할 일
          const video = document.createElement("video")
          // 5. 내가 수락을 했으면 상대방도 리스너 이벤트가 실행되면서 내 영상이 보여지겠끔해야겠지?
          call.on("stream", (userVideoStream) => {
            addVideoStream(video, userVideoStream)
          })
        })

        // ws 전송받으려면 이렇게 해야하네... socket.io보다는 아쉽네
        socket.onmessage = (message) => {
          const data = JSON.parse(message.data)
          const { type } = data

          switch (type) {
            // 1. 해당 room에 새로운 사용자가 연결시 상대방 userId를 받음
            case "user-connected": {
              const { id: userId } = data
              console.log(`User connected: ${userId}`)
              connectToNewUser(userId, stream)
            }
          }
          // 1. 해당 room에 새로운 사용자가 연결시 상대방 userId를 받음
          console.log(data)
        }
      })
  }, [addVideoStream, connectToNewUser, peer, roomId, socket])

  return <div ref={videoGridRef} className="video-grid" />
}

export default WebrtcClient

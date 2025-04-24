import React from 'react'
import { Users, ArrowRight, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'

const currentGames = [
  {
    id: 1,
    title: '죽음의 파티',
    type: '머더미스터리',
    server: '게임마스터 길드',
    players: '8/10',
    status: '진행중',
  },
  {
    id: 2,
    title: '미스터리 맨션',
    type: '방탈출',
    server: '이스케이프 클럽',
    players: '5/6',
    status: '진행중',
  },
  {
    id: 3,
    title: '숨겨진 증거',
    type: '크라임씬',
    server: '추리 탐정단',
    players: '4/4',
    status: '진행중',
  },
  {
    id: 4,
    title: '도시 미스터리',
    type: '리얼월드',
    server: '어드벤처 그룹',
    players: '12/16',
    status: '모집중',
  },
]

const CurrentGamesSection: React.FC = () => {
  return (
    <section className="py-8 px-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center">
            <Users className="h-5 w-5 mr-2 text-primary" />
            현재 플레이 중인 게임
          </h2>
          <Button variant="ghost" size="sm">
            모든 게임 보기 <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
        <div className="glass rounded-lg overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/20">
                <th className="text-left p-3">게임 이름</th>
                <th className="text-left p-3">유형</th>
                <th className="text-left p-3 hidden md:table-cell">서버</th>
                <th className="text-left p-3">플레이어</th>
                <th className="text-left p-3">상태</th>
                <th className="text-right p-3"></th>
              </tr>
            </thead>
            <tbody>
              {currentGames.map((game) => (
                <tr
                  key={game.id}
                  className="border-b border-slate-700/10 last:border-0 hover:bg-slate-800/5"
                >
                  <td className="p-3 font-medium">{game.title}</td>
                  <td className="p-3">{game.type}</td>
                  <td className="p-3 hidden md:table-cell">{game.server}</td>
                  <td className="p-3">{game.players}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        game.status === '진행중'
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}
                    >
                      {game.status}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <Button variant="ghost" size="sm" className="h-7 px-2">
                      참가
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2">
                      <Eye className="h-4 w-4 mr-1" />
                      관전
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default CurrentGamesSection

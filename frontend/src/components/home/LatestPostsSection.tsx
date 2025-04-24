import React from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const latestPosts = {
  crimeScene: [
    { id: 1, title: '살인사건 해결하기: 초보자 가이드', author: '탐정마스터', date: '2023-06-14' },
    { id: 2, title: '크라임씬 - 비밀의 방 후기', author: '게임러버', date: '2023-06-13' },
    { id: 3, title: '증거 수집의 기술', author: '셜록', date: '2023-06-12' },
    { id: 4, title: '크라임씬 시나리오 아이디어 공유', author: '시나리오작가', date: '2023-06-10' },
    { id: 5, title: '범인 찾기: 심리학적 접근', author: '프로파일러', date: '2023-06-09' },
  ],
  escapeRoom: [
    { id: 1, title: '시간 제한 방탈출: 전략과 팁', author: '탈출왕', date: '2023-06-14' },
    { id: 2, title: "신규 방탈출 테마 '고대의 비밀' 후기", author: '방탈출고수', date: '2023-06-12' },
    { id: 3, title: '방탈출 퍼즐 디자인 아이디어', author: '퍼즐메이커', date: '2023-06-11' },
    { id: 4, title: '초보자를 위한 방탈출 가이드', author: '탈출노비', date: '2023-06-10' },
    { id: 5, title: '온라인 방탈출 추천', author: '디지털탈출러', date: '2023-06-08' },
  ],
  murderMystery: [
    { id: 1, title: "머더미스터리 '어두운 저택' 역할 소개", author: '게임마스터', date: '2023-06-15' },
    { id: 2, title: '추리 게임에서 캐릭터 연기 팁', author: '배우지망생', date: '2023-06-13' },
    { id: 3, title: '머더미스터리 시나리오 작성법', author: '미스터리작가', date: '2023-06-11' },
    { id: 4, title: '온라인으로 즐기는 머더미스터리', author: '디지털게이머', date: '2023-06-09' },
    { id: 5, title: '초보자를 위한 머더미스터리 규칙 설명', author: '룰마스터', date: '2023-06-07' },
  ],
  realWorld: [
    { id: 1, title: '실제 사건을 게임으로: 윤리적 고려사항', author: '현실게임러', date: '2023-06-14' },
    { id: 2, title: "리얼월드 게임 '도시 미스터리' 후기", author: '어반익스플로러', date: '2023-06-12' },
    { id: 3, title: '리얼월드 게임 준비 체크리스트', author: '준비왕', date: '2023-06-10' },
    { id: 4, title: '위치 기반 게임의 미래', author: '테크놀로지스트', date: '2023-06-08' },
    { id: 5, title: '리얼월드 게임 안전 수칙', author: '안전제일', date: '2023-06-06' },
  ],
}

const BoardSection = ({ title, posts }: { title: string; posts: typeof latestPosts.crimeScene }) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-base font-semibold">{title}</h3>
      <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
        더보기 <ArrowRight className="ml-1 h-3 w-3" />
      </Button>
    </div>
    <div className="glass p-3 rounded-lg">
      <ul className="space-y-2">
        {posts.map((post) => (
          <li
            key={post.id}
            className="border-b border-slate-700/20 pb-2 last:border-0 last:pb-0"
          >
            <a href="#" className="hover:text-primary transition-colors">
              <h4 className="text-sm font-medium truncate">{post.title}</h4>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{post.author}</span>
                <span>{post.date}</span>
              </div>
            </a>
          </li>
        ))}
      </ul>
    </div>
  </div>
)

const LatestPostsSection: React.FC = () => {
  return (
    <section className="py-8 px-4">
      <div className="container mx-auto">
        <h2 className="text-xl font-bold mb-4">최신 게시글</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <BoardSection title="크라임씬" posts={latestPosts.crimeScene} />
          <BoardSection title="방탈출" posts={latestPosts.escapeRoom} />
          <BoardSection title="머더미스터리" posts={latestPosts.murderMystery} />
          <BoardSection title="리얼월드" posts={latestPosts.realWorld} />
        </div>
      </div>
    </section>
  )
}

export default LatestPostsSection

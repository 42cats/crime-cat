import React from 'react'
import { motion } from 'framer-motion'
import { Megaphone, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const announcements = [
  {
    id: 1,
    title: '새로운 게임 테마가 추가되었습니다',
    date: '2023-06-15',
    content: '이번 업데이트에서는 3개의 새로운 머더미스터리 테마가 추가되었습니다.',
  },
  {
    id: 2,
    title: '시스템 업데이트 안내',
    date: '2023-06-10',
    content: '6월 15일 02:00-04:00 사이에 서버 점검이 있을 예정입니다.',
  },
  {
    id: 3,
    title: '여름 이벤트 안내',
    date: '2023-06-05',
    content: '여름 특별 이벤트가 7월 1일부터 시작됩니다. 많은 참여 바랍니다.',
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}

const AnnouncementSection: React.FC = () => {
  return (
    <section className="py-8 px-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center">
            <Megaphone className="h-5 w-5 mr-2 text-primary" />
            공지사항
          </h2>
          <Button variant="ghost" size="sm" className="text-sm">
            더보기 <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
        <motion.div
          className="space-y-3"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          {announcements.map((announcement) => (
            <motion.div
              key={announcement.id}
              className="glass p-4 rounded-lg"
              variants={item}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className="text-base font-semibold">{announcement.title}</h3>
                <span className="text-xs text-muted-foreground">{announcement.date}</span>
              </div>
              <p className="text-sm text-muted-foreground">{announcement.content}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default AnnouncementSection

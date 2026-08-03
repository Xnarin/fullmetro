@AGENTS.md

나는 컴퓨터공학과를 전공한 학생이지만, 개발 경험은 적다.
진행하면서 기억해두거나 공부해야할 CS지식, 프로젝트 지식이 있다면
부연 설명을 해주면 좋겠다

내가 만들 것은 공항철도 6개 역(김포공항·마곡나루·DMC·홍대입구·공덕·서울역) 근처 맛집을 저장하고, 다녀온 곳에 체크와 별점을 남기는 개인용 웹서비스 이다.

서비스의 기술 스택은 다음과 같다.

Frontend    Next.js (App Router, Turbopack)

Backend     Supabase (Postgres DB) — places 테이블에 데이터 저장
            @supabase/supabase-js 클라이언트로 서버 컴포넌트에서 직접 조회 (src/lib/supabase.ts)

배포        Vercel(프로젝트: aia-gent01/fullmetro, fullmetro.vercel.app)
환경변수: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (Production/Preview/Development에 등록됨)

App Router 기반 (src/app/page.tsx, layout.tsx)

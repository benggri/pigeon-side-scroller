# 구구 대모험 (pigeon-side-scroller)

비둘기 "구구"가 공원을 달리며 점프로 장애물과 몬스터를 피하는 횡스크롤 게임. Next.js + Canvas, 이펙트는 [pixelfx](https://github.com/patch-gg/pixelfx) (MIT).

## 조작
- `←` `→` / `A` `D`: 걷기
- `Space` / `↑` / `W`: 점프 (꾹 누르면 파닥파닥 천천히 내려옴, 짧게 누르면 낮은 점프)
- `P` / `Esc`: 일시정지
- 터치 기기: 화면 아래 ◀ ▶ / 점프 버튼

장애물(꼬깔·소화전·쓰레기통)은 옆에서 부딪히면 하트를 잃고 위에는 올라설 수 있다. 몬스터(슬라임·박쥐)는 위에서 밟으면 물리친다. 하트 3개, 점수 = 거리(m) + 동전×10 + 밟기×20, 최고 기록은 localStorage.

## 개발
```bash
npm install
npm run dev     # http://localhost:3000
npm test        # 게임 로직 단위 테스트 (vitest)
npm run lint
npm run build
```
개발용 미리보기: `npx tsx scripts/preview-scene.ts out.png [초] [시드]` (화면 PNG 렌더)

## 구조
- `src/game/world.ts` 물리·충돌·진행 (DOM 없음, 테스트 대상)
- `src/game/level.ts` 시드 기반 무한 레벨 생성, 난이도 상승
- `src/game/render.ts` 시차 스크롤 배경 + 엔티티를 pixelfx 프레임에 그리기
- `src/game/sprites.ts` 비둘기·장애물 픽셀 스프라이트
- `src/game/pixelfx.ts` pixelfx 타입 래퍼 (slime, bat, coin-spin, poof, collect-burst, hit-spark, confetti)
- `src/components/Game.tsx` 캔버스 루프, 입력, HUD/오버레이

## 배포 (Vercel)
Root Directory 를 `application` 으로 지정. pixelfx 는 GitHub 커밋 tarball(https)로 고정되어 있어 SSH 키 없이 설치된다.

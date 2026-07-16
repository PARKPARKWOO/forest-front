import kakaoLogo from '../assets/kakao.png';
import naverLogo from '../assets/naver.png';
import { KAKAO_LOGIN_URL, NAVER_LOGIN_URL } from '../utils/authUrls';

export default function LoginOptions() {
  return (
    <div className="space-y-4">
      <a
        href={KAKAO_LOGIN_URL}
        className="flex min-h-12 w-full items-center justify-center rounded-lg bg-yellow-300 px-4 py-3 text-lg font-semibold text-black transition-colors duration-200 hover:bg-yellow-400 focus-visible:ring-2 focus-visible:ring-yellow-600 focus-visible:ring-offset-2"
      >
        <img src={kakaoLogo} alt="" className="mr-2 h-6 w-auto" />
        카카오로 시작하기
      </a>
      <a
        href={NAVER_LOGIN_URL}
        className="flex min-h-12 w-full items-center justify-center rounded-lg bg-[#03C75A] px-4 py-3 text-lg font-semibold text-white transition-colors duration-200 hover:bg-[#02b351] focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:ring-offset-2"
      >
        <img src={naverLogo} alt="" className="mr-2 h-6 w-auto" />
        네이버로 시작하기
      </a>
    </div>
  );
}

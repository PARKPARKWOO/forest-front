export default function Donation() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">후원하기</h1>
      <div className="prose prose-green max-w-none">
        <div className="bg-green-50 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold text-green-800 mb-3">
            여러분의 후원이 숲을 더 푸르게 만듭니다
          </h2>
          <p className="text-green-700">
            전북생명의숲은 시민들의 후원으로 운영되는 비영리 단체입니다. 
            여러분의 소중한 후원금은 우리 지역의 숲을 가꾸고 보전하는데 사용됩니다.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h3 className="text-lg font-semibold mb-4">후원 계좌</h3>
          <div className="space-y-2">
            <p>농협은행: 123-4567-8901-23</p>
            <p>예금주: 전북생명의숲</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">후원 문의</h3>
          <div className="space-y-2">
            <p>전화: 063-123-4567</p>
            <p>이메일: support@jbforest.org</p>
          </div>
        </div>
      </div>
    </div>
  );
} 
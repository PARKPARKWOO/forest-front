import Layout from '../../components/Layout';

export default function UserHome() {
  return (
    <Layout>
      <section className="relative bg-green-100 py-32 w-screen -mx-[calc((100vw-100%)/2)]">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-6xl font-extrabold text-black mb-8">
            전북생명의숲에 오신 것을 환영합니다 🌳
          </h1>
          <p className="text-2xl text-black">
            숲과 사람을 잇는 생명의 이야기, 함께 만들어갑니다.
          </p>
        </div>
      </section>
    </Layout>
  );
}

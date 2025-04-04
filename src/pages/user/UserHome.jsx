// import { useQuery } from '@tanstack/react-query';
// import { fetchCategories } from '../../services/categoryService';
// import { fetchPostsByCategory } from '../../services/postService';
// import { useState } from 'react';
// import Layout from '../../components/Layout';

// export default function UserHome() {
//   const [selectedCategoryId, setSelectedCategoryId] = useState(null);

//   const { data: categories, isLoading: categoriesLoading } = useQuery({
//     queryKey: ['categories'],
//     queryFn: fetchCategories,
//   });

//   const { data: posts, isLoading: postsLoading } = useQuery({
//     queryKey: ['posts', selectedCategoryId],
//     queryFn: () => fetchPostsByCategory(selectedCategoryId),
//     enabled: !!selectedCategoryId,
//   });

//   return (
//     <Layout>
//       {/* Hero Section */}
//       <section className="relative bg-green-100 py-16 mb-10">
//         <div className="container mx-auto px-6 text-center">
//           <h1 className="text-4xl font-extrabold text-green-900 mb-4">
//             전북생명의숲에 오신 것을 환영합니다 🌳
//           </h1>
//           <p className="text-lg text-green-800">
//             숲과 사람을 잇는 생명의 이야기, 함께 만들어갑니다.
//           </p>
//         </div>
//       </section>

//       {/* Category Section */}
//       <section className="max-w-6xl mx-auto px-4">
//         <h2 className="text-2xl font-bold text-green-700 mb-6">카테고리 선택</h2>

//         {categoriesLoading ? (
//           <div className="text-gray-500 text-center">카테고리를 불러오는 중입니다...</div>
//         ) : (
//           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-10">
//             {categories.map((category) => (
//               <button
//                 key={category.id}
//                 className={`px-4 py-3 rounded-lg text-sm font-medium transition border ${
//                   selectedCategoryId === category.id
//                     ? 'bg-green-600 text-white border-green-600'
//                     : 'bg-white text-green-700 border-green-300 hover:bg-green-50'
//                 }`}
//                 onClick={() => setSelectedCategoryId(category.id)}
//               >
//                 {category.name}
//               </button>
//             ))}
//           </div>
//         )}
//       </section>

//       {/* Post List Section */}
//       {selectedCategoryId && (
//         <section className="max-w-4xl mx-auto px-4 pb-16">
//           <h3 className="text-xl font-semibold text-gray-800 mb-4">게시글 목록</h3>
//           {postsLoading ? (
//             <div className="text-gray-500">게시글을 불러오는 중입니다...</div>
//           ) : (
//             <ul className="divide-y divide-gray-200 bg-white rounded-lg shadow">
//               {posts.map((post) => (
//                 <li key={post.id} className="py-4 px-6 hover:bg-gray-50">
//                   <span className="text-lg text-gray-700">{post.title}</span>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </section>
//       )}
//     </Layout>
//   );
// }

import { useQuery } from '@tanstack/react-query';
import { fetchCategories } from '../../services/categoryService';
import { fetchPostsByCategory } from '../../services/postService';
import { useState } from 'react';
import Layout from '../../components/Layout';

import '../../styles/usforest.css'; // 울산생명의숲 스타일 시트 임포트 (전역 스타일 적용)

export default function UserHome() {
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ['posts', selectedCategoryId],
    queryFn: () => fetchPostsByCategory(selectedCategoryId),
    enabled: !!selectedCategoryId,
  });

  return (
    <Layout>
        {/* Category Section */}
        <section className="container content-section">
        <h2 className="section-title">카테고리 선택</h2>

        {categoriesLoading ? (
          <div className="loading">카테고리를 불러오는 중입니다...</div>
        ) : (
          <div className="category-grid">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`category-btn ${
                  selectedCategoryId === category.id ? 'active' : ''
                }`}
                onClick={() => setSelectedCategoryId(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}
      </section>
      
      {/* Hero Section */}
      <section className="main-visual">
        <div className="sliderkit-text">
          <h1 className="lviewa">전북생명의숲에 오신 것을 환영합니다 🌳</h1>
          <p className="sviewa">숲과 사람을 잇는 생명의 이야기, 함께 만들어갑니다.</p>
        </div>
        <div
          className="backgroundimg1"
          style={{ backgroundImage: "url('https://usforest.or.kr/theme/dt_simple03/html/image/main_visual01.png')" }}
        ></div>
      </section>


      {/* Post List Section */}
      {selectedCategoryId && (
        <section className="container content-section">
          <h3 className="section-title">게시글 목록</h3>
          {postsLoading ? (
            <div className="loading">게시글을 불러오는 중입니다...</div>
          ) : (
            <ul className="post-list">
              {posts.map((post) => (
                <li key={post.id} className="post-item">
                  <span className="post-title">{post.title}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </Layout>
  );
}

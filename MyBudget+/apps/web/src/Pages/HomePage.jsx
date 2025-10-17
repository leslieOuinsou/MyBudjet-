import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer.jsx';

const features = [
	{
		icon: '📈',
		title: 'Suivi Revenus & Dépenses',
		desc: 'Visualisez facilement vos flux de trésorerie avec des données claires et détaillées pour chaque transaction.',
	},
	{
		icon: '🏦',
		title: 'Catégories Personnalisables',
		desc: 'Organisez vos finances avec des catégories sur mesure pour un aperçu précis de vos habitudes de dépense.',
	},
	{
		icon: '💼',
		title: 'Gestion de Portefeuilles Multiples',
		desc: 'Gérez plusieurs comptes bancaires, cartes de crédit et portefeuilles d’investissement en un seul endroit.',
	},
	{
		icon: '📊',
		title: 'Graphiques Financiers Intuitifs',
		desc: 'Obtenez des informations précieuses grâce à des graphiques dynamiques et faciles à comprendre sur vos finances.',
	},
	{
		icon: '🔔',
		title: 'Alertes Budgétaires Intelligentes',
		desc: 'Recevez des notifications personnalisées pour rester dans les limites de votre budget et éviter les dépassements.',
	},
	{
		icon: '🔮',
		title: 'Prévisions Financières',
		desc: 'Anticipez l’avenir avec des prévisions financières basées sur vos données pour une meilleure planification.',
	},
	{
		icon: '💡',
		title: 'Conseils Personnalisés',
		desc: 'Bénéficiez de recommandations intelligentes pour optimiser vos dépenses et maximiser votre épargne.',
	},
	{
		icon: '⬆️',
		title: 'Importation de Données',
		desc: 'Importez rapidement vos relevés bancaires pour une configuration facile et sans effort.',
	},
	{
		icon: '⬇️',
		title: 'Exportation de Données',
		desc: 'Exportez vos données financières dans divers formats pour analyse ou archivage externe.',
	},
];

const testimonials = [
	{
		name: 'Sophie Dubois',
		job: 'Analyste Financière',
		text: 'MyBudget+ a transformé ma façon de gérer mon argent. C’est intuitif, puissant et a changé ma vie financière !',
		img: '/images/people/person1.jpg',
	},
	{
		name: 'Marc Laurent',
		job: 'Entrepreneur',
		text: 'Enfin une application qui comprend mes besoins. Les prévisions sont incroyablement précises.',
		img: '/images/people/person2.jpg',
	},
	{
		name: 'Léa Bernard',
		job: 'Étudiante',
		text: 'La gestion des catégories est un jeu d’enfant. J’ai un contrôle total sur mes dépenses maintenant.',
		img: '/images/people/person3.jpg',
	},
	{
		name: 'Camille Bernard',
		job: 'Graphiste',
		text: 'Simple, efficace et m’aide à économiser pour mes projets. Je recommande MyBudget+ à tous mes amis !',
		img: '/images/people/person4.jpg',
	},
];

export default function HomePage() {
	return (
		<div className='min-h-screen bg-gray-100 flex flex-col'>
			{/* Header */}
			<header className='bg-white shadow-sm'>
				<div className='max-w-7xl mx-auto flex justify-between items-center py-4 px-6'>
					<div className='flex items-center gap-2'>
						<span className='text-[#1E73BE] font-bold text-xl'>MyBudget+</span>
					</div>
					<nav className='hidden md:flex gap-8 text-[#343A40] font-medium'>
						<a href='#features' className='hover:text-[#1E73BE]'>
							Fonctionnalités
						</a>
						<a href='#testimonials' className='hover:text-[#1E73BE]'>
							Témoignages
						</a>
						<a href='#pricing' className='hover:text-[#1E73BE]'>
							Prix
						</a>
						<a href='#contact' className='hover:text-[#1E73BE]'>
							Contact
						</a>
					</nav>
					<div className='flex gap-2'>
						<Link
							to='/login'
							className='text-[#343A40] px-4 py-2 rounded hover:bg-[#F5F7FA]'>
							Se Connecter
						</Link>
						<Link
							to='/signup'
							className='bg-[#1E73BE] text-white px-4 py-2 rounded hover:bg-[#155a8a]'>
							S’inscrire
						</Link>
					</div>
				</div>
			</header>

			{/* Hero */}
			<section className='bg-[#E9F7FB] py-16'>
				<div className='max-w-7xl mx-auto flex flex-col md:flex-row items-center px-6 gap-12'>
					<div className='flex-1'>
						<h1 className='text-4xl md:text-5xl font-bold text-[#343A40] mb-6'>
							Gérez Votre Argent,
							<br /> Simplifiez Votre Vie avec MyBudget+
						</h1>
						<p className='text-[#6C757D] mb-8'>
							Suivez vos revenus et dépenses, créez des budgets personnalisés, et
							atteignez vos objectifs financiers en toute simplicité.
						</p>
						<div className='flex gap-4'>
							<Link
								to='/signup'
								className='bg-[#1E73BE] text-white px-6 py-3 rounded font-semibold hover:bg-[#155a8a]'>
								Commencer Gratuitement
							</Link>
							<Link
								to='/features'
								className='border border-[#1E73BE] text-[#1E73BE] px-6 py-3 rounded font-semibold hover:bg-[#F5F7FA]'>
								Découvrir les Fonctionnalités
							</Link>
						</div>
					</div>
					<div className='flex-1 flex justify-center'>
						<div className='w-full max-w-1xl h-[320px] bg-white rounded shadow flex items-center justify-center overflow-hidden'>
							<img
								src='/images/people/hero.jpg'
								alt='Hero'
								className='w-full h-full object-cover'
							/>
						</div>
					</div>
				</div>
			</section>

			{/* Features */}
			<section id='features' className='py-16'>
				<div className='max-w-7xl mx-auto px-6'>
					<h2 className='text-3xl font-bold text-[#343A40] text-center mb-4'>
						Fonctionnalités Clés de MyBudget+
					</h2>
					<p className='text-[#6C757D] text-center mb-12'>
						Découvrez comment MyBudget+ vous aide à prendre le contrôle de vos
						finances avec des outils puissants et faciles à utiliser.
					</p>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
						{features.map((f, i) => (
							<div
								key={i}
								className='bg-white rounded-lg shadow p-6 flex flex-col items-start gap-4 border border-[#F5F7FA]'>
								<span
									className='text-3xl'
									style={{
										color:
											i === 4
												? '#DC3545'
												: i === 5
												? '#28A745'
												: '#1E73BE',
									}}>
									{f.icon}
								</span>
								<h3 className='text-lg font-semibold text-[#343A40]'>
									{f.title}
								</h3>
								<p className='text-[#6C757D] text-sm'>{f.desc}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Testimonials */}
			<section id='testimonials' className='bg-[#F5F7FA] py-16'>
				<div className='max-w-7xl mx-auto px-6'>
					<h2 className='text-2xl font-bold text-[#343A40] text-center mb-8'>
						Ce que Nos Utilisateurs Disent
					</h2>
					<div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
						{testimonials.map((t, i) => (
							<div
								key={i}
								className='bg-white rounded-lg shadow p-6 flex flex-col gap-4 border border-[#F5F7FA] items-center'>
								<img
									src={t.img}
									alt={t.name}
									className='w-16 h-16 rounded-full object-cover mb-2'
								/>
								<p className='text-[#343A40] italic text-center'>
									“{t.text}”
								</p>
								<div className='flex flex-col items-center'>
									<div className='font-semibold text-[#343A40]'>
										{t.name}
									</div>
									<div className='text-xs text-[#6C757D]'>{t.job}</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Footer */}
			<Footer />
		</div>
	);
}

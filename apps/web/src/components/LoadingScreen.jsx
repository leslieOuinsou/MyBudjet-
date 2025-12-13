import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Aurora from './Aurora';

export default function LoadingScreen() {
	const navigate = useNavigate();
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		// Animation de progression
		const interval = setInterval(() => {
			setProgress(prev => {
				if (prev >= 100) {
					clearInterval(interval);
					return 100;
				}
				return prev + 2;
			});
		}, 50);

		// Après 3 secondes, naviguer vers la home page
		const timer = setTimeout(() => {
			navigate('/');
		}, 3000);

		return () => {
			clearInterval(interval);
			clearTimeout(timer);
		};
	}, [navigate]);

	return (
		<div className='min-h-screen bg-gradient-to-br from-[#1E73BE] via-[#155a8a] to-[#0d4a6f] flex items-center justify-center relative overflow-hidden'>
			{/* Animated Aurora background - Palette Fintech */}
			<Aurora 
				colorStops={["#1E73BE", "#28A745", "#155a8a"]}
				blend={0.5}
				amplitude={1.0}
				speed={0.5}
			/>

			{/* Content */}
			<div className='relative z-10 text-center px-4'>
				{/* Logo/Icon */}
				<div className='mb-8 animate-bounce'>
					<div className='w-24 h-24 mx-auto bg-white rounded-2xl shadow-2xl flex items-center justify-center transform hover:scale-110 transition-transform duration-300'>
						<span className='text-4xl font-bold text-[#1E73BE]'>M</span>
					</div>
				</div>

				{/* Title */}
				<h1 className='text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 animate-fade-in'>
					MyBudget+
				</h1>

				{/* Slogan */}
				<p className='text-xl md:text-2xl text-white/90 mb-12 font-medium animate-slide-up'>
					Prenez le contrôle de vos finances avec MyBudget+
				</p>

				{/* Progress Bar */}
				<div className='max-w-md mx-auto'>
					<div className='bg-white/20 rounded-full h-3 overflow-hidden shadow-lg'>
						<div 
							className='h-full bg-gradient-to-r from-white to-blue-100 rounded-full transition-all duration-300 ease-out'
							style={{ width: `${progress}%` }}
						></div>
					</div>
					<p className='text-white/80 mt-4 text-sm'>{progress}%</p>
				</div>

				{/* Loading dots */}
				<div className='flex justify-center gap-2 mt-8'>
					<div className='w-3 h-3 bg-white rounded-full animate-pulse' style={{ animationDelay: '0ms' }}></div>
					<div className='w-3 h-3 bg-white rounded-full animate-pulse' style={{ animationDelay: '150ms' }}></div>
					<div className='w-3 h-3 bg-white rounded-full animate-pulse' style={{ animationDelay: '300ms' }}></div>
				</div>
			</div>

					<style>{`
			@keyframes fade-in {
				from {
					opacity: 0;
				}
				to {
					opacity: 1;
				}
			}
			.animate-fade-in {
				animation: fade-in 1s ease-out;
			}
			@keyframes slide-up {
				from {
					opacity: 0;
					transform: translateY(20px);
				}
				to {
					opacity: 1;
					transform: translateY(0);
				}
			}
			.animate-slide-up {
				animation: slide-up 1s ease-out 0.3s both;
			}
		`}</style>
		</div>
	);
}

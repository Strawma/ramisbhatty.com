<script lang="ts">
	import { resolve } from '$app/paths';
	import EntryList from '#lib/components/main/EntryList.svelte';
	import ModuleMark from '#lib/components/main/ModuleMark.svelte';
	import {
		pageContent,
		pageIntroductions,
		type AcademicModule,
		type AcademicYearDetails
	} from '#lib/content.ts';
	let { data } = $props();
	const Content = pageContent.education;
	const SchoolContent = pageContent['education-school'];
	const schoolQualifications = ['education-a-levels', 'education-gcses'].map((slug) => ({
		slug,
		title: pageIntroductions[slug].title,
		Content: pageContent[slug]
	}));

	interface SemesterGroup {
		semester?: string;
		modules: AcademicModule[];
	}

	interface YearGroup {
		year: string;
		semesters: SemesterGroup[];
		showSemesterHeadings: boolean;
		average?: number;
		ongoing: boolean;
		awards: string[];
	}

	function semesterOrder(semester?: string): number {
		const normalized = semester?.toLocaleLowerCase('en-GB');
		if (!normalized) return 4;
		if (normalized.includes('full')) return 1;
		if (normalized.includes('1') || normalized.includes('one')) return 2;
		if (normalized.includes('2') || normalized.includes('two')) return 3;
		return 4;
	}

	function yearStart(year: string): number {
		const match = year.match(/\b(\d{4})\/\d{2}\b/);
		return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
	}

	function weightedAverage(modules: AcademicModule[]): number | undefined {
		if (!modules.length || modules.some((module) => module.mark === undefined)) return undefined;
		const credits = modules.reduce((total, module) => total + module.credits, 0);
		const weightedMarks = modules.reduce(
			(total, module) => total + (module.mark ?? 0) * module.credits,
			0
		);
		return Math.round((weightedMarks / credits) * 10) / 10;
	}

	function groupModules(
		modules: AcademicModule[],
		academicYears: AcademicYearDetails[] = []
	): YearGroup[] {
		const years: { year: string; modules: AcademicModule[] }[] = academicYears.map(({ year }) => ({
			year,
			modules: []
		}));

		for (const module of modules) {
			const year = years.find((group) => group.year === module.year);
			if (year) year.modules.push(module);
			else years.push({ year: module.year, modules: [module] });
		}

		years.sort((left, right) => yearStart(left.year) - yearStart(right.year));

		return years.map(({ year, modules: yearModules }) => {
			const details = academicYears.find((details) => details.year === year);
			const semesterGroups: SemesterGroup[] = [];

			for (const module of yearModules) {
				const semester = semesterGroups.find((group) => group.semester === module.semester);
				if (semester) semester.modules.push(module);
				else semesterGroups.push({ semester: module.semester, modules: [module] });
			}

			semesterGroups.sort(
				(left, right) =>
					semesterOrder(left.semester) - semesterOrder(right.semester) ||
					(left.semester ?? '').localeCompare(right.semester ?? '', 'en-GB')
			);

			return {
				year,
				semesters: semesterGroups,
				showSemesterHeadings: semesterGroups.some((group) => group.semester),
				average: details?.ongoing ? undefined : weightedAverage(yearModules),
				ongoing: details?.ongoing ?? false,
				awards: details?.awards ?? []
			};
		});
	}

	let moduleGroups = $derived(groupModules(data.modules, data.page.academicYears));
</script>

<svelte:head>
	<title>{data.page.title} | Ramis Bhatty</title>
	<meta name="description" content={data.page.description} />
</svelte:head>

<p class="font-mono text-sm text-neutral-500">{data.page.path}</p>
<h1>{data.page.title}</h1>

<section aria-labelledby="secondary-education" class="mt-6">
	<details class="border-y border-neutral-300">
		<summary
			class="cursor-pointer py-5 marker:text-neutral-500 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
		>
			<h2 id="secondary-education" class="m-0 ml-2 inline text-2xl">Secondary education</h2>
		</summary>
		<div class="pb-6">
			<SchoolContent />
			<div class="mt-6 space-y-4">
				{#each schoolQualifications as qualification (qualification.slug)}
					<details class="border border-neutral-300 bg-neutral-50 px-5">
						<summary
							class="cursor-pointer py-5 marker:text-neutral-500 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
						>
							<span role="heading" aria-level="3" class="ml-2 text-lg font-semibold">
								{qualification.title}
							</span>
						</summary>
						<div class="pb-5">
							<qualification.Content />
						</div>
					</details>
				{/each}
			</div>
		</div>
	</details>
</section>

<section aria-labelledby="university" class="mt-6">
	<details open class="border-y border-neutral-300">
		<summary
			class="cursor-pointer py-5 marker:text-neutral-500 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
		>
			<h2 id="university" class="m-0 ml-2 inline text-2xl">University</h2>
		</summary>
		<div class="pb-6">
			<Content />

			{#if moduleGroups.length}
				<div class="not-prose mt-10 space-y-4">
					{#each moduleGroups as yearGroup, index (yearGroup.year)}
						<details
							open={index === moduleGroups.length - 1}
							class="group border-y border-neutral-300 bg-neutral-50"
						>
							<summary
								class="cursor-pointer py-5 marker:text-neutral-500 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4"
							>
								<span class="ml-2 inline-flex flex-wrap items-center gap-x-3 gap-y-2">
									<span role="heading" aria-level="3" class="text-lg font-semibold">
										{yearGroup.year}
									</span>
									{#if yearGroup.ongoing}
										<span class="font-mono text-sm text-neutral-600">Ongoing</span>
									{:else if yearGroup.average !== undefined}
										<ModuleMark mark={yearGroup.average} label="Year average" />
									{/if}
								</span>
								{#if yearGroup.awards.length}
									<span class="mt-2 ml-7 block space-y-1 text-sm text-neutral-600">
										{#each yearGroup.awards as award (award)}
											<span class="block"><span class="font-semibold">Award:</span> {award}</span>
										{/each}
									</span>
								{/if}
							</summary>
							{#if yearGroup.semesters.length}
								<div class="pb-6">
									{#each yearGroup.semesters as semesterGroup (semesterGroup.semester ?? 'unspecified')}
										{#if yearGroup.showSemesterHeadings}
											<h4 class="mt-6 text-base font-semibold">
												{semesterGroup.semester ?? 'Semester not specified'}
											</h4>
										{/if}
										<EntryList
											headingLevel={yearGroup.showSemesterHeadings ? 5 : 4}
											entries={semesterGroup.modules.map((module) => ({
												href: resolve('/(main)/education/[code]', {
													code: module.code.toLowerCase()
												}),
												title: `${module.code}: ${module.title}`,
												mark: module.mark,
												summary: module.summary,
												tags: [...module.skills, ...module.technologies],
												draft: module.status === 'draft'
											}))}
										/>
									{/each}
								</div>
							{/if}
						</details>
					{/each}
				</div>
			{:else}
				<p class="border-y border-neutral-300 py-6">Module entries are being assembled.</p>
			{/if}
		</div>
	</details>
</section>

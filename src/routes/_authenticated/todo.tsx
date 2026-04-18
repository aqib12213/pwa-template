import { Trans, useLingui } from "@lingui/react/macro";
import { createFileRoute } from "@tanstack/react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { CircleCheckBig, ListTodo, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DB } from "@/db/db";

export const Route = createFileRoute("/_authenticated/todo")({
	component: TodoRoute,
});

type TodoFilter = "all" | "active" | "completed";

function TodoRoute() {
	const { t: translate } = useLingui();
	const [newTitle, setNewTitle] = useState("");
	const [filter, setFilter] = useState<TodoFilter>("all");

	const todos = useLiveQuery(
		async () => DB.todos.orderBy("createdAt").reverse().toArray(),
		[]
	);

	const todoList = todos ?? [];
	const completedCount = useMemo(
		() => todoList.filter((item) => item.completed).length,
		[todoList]
	);
	const activeCount = todoList.length - completedCount;

	const filteredTodos = useMemo(() => {
		switch (filter) {
			case "active":
				return todoList.filter((item) => !item.completed);
			case "completed":
				return todoList.filter((item) => item.completed);
			default:
				return todoList;
		}
	}, [filter, todoList]);

	const addTodo = async () => {
		const title = newTitle.trim();
		if (!title) {
			return;
		}

		await DB.todos.add({
			title,
			completed: false,
			createdAt: Date.now(),
		});
		setNewTitle("");
	};

	const clearCompleted = async () => {
		await DB.todos.filter((item) => item.completed).delete();
	};

	return (
		<>
			<Header className="border-b">
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbPage>
								<Trans>Todo</Trans>
							</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
			</Header>

			<main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
				<div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
					<div className="space-y-2">
						<h1 className="font-heading font-semibold text-2xl tracking-tight md:text-3xl">
							<Trans>Dexie Todo App</Trans>
						</h1>
						<p className="text-muted-foreground text-sm md:text-base">
							<Trans>
								Your tasks are stored locally in IndexedDB with Dexie and update
								live on this page.
							</Trans>
						</p>
					</div>

					<Card>
						<CardHeader className="gap-3">
							<CardTitle>
								<Trans>Add a task</Trans>
							</CardTitle>
							<div className="flex flex-wrap items-center gap-2">
								<Badge variant="outline">
									{translate`${activeCount} active`}
								</Badge>
								<Badge variant="outline">
									{translate`${completedCount} completed`}
								</Badge>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							<form
								className="flex flex-col gap-2 sm:flex-row"
								onSubmit={async (event) => {
									event.preventDefault();
									await addTodo();
								}}
							>
								<Input
									aria-label={translate`Task title`}
									onChange={(event) => setNewTitle(event.currentTarget.value)}
									placeholder={translate`What needs to be done?`}
									value={newTitle}
								/>
								<Button disabled={newTitle.trim().length === 0} type="submit">
									<Trans>Add task</Trans>
								</Button>
							</form>

							<div className="flex flex-wrap items-center justify-between gap-3">
								<Tabs
									onValueChange={(value) => setFilter(value as TodoFilter)}
									value={filter}
								>
									<TabsList variant="line">
										<TabsTrigger value="all">
											<Trans>All</Trans>
										</TabsTrigger>
										<TabsTrigger value="active">
											<Trans>Active</Trans>
										</TabsTrigger>
										<TabsTrigger value="completed">
											<Trans>Completed</Trans>
										</TabsTrigger>
									</TabsList>
								</Tabs>

								<Button
									disabled={completedCount === 0}
									onClick={async () => {
										await clearCompleted();
									}}
									variant="ghost"
								>
									<CircleCheckBig className="size-4" />
									<Trans>Clear completed</Trans>
								</Button>
							</div>

							{filteredTodos.length === 0 ? (
								<Empty className="rounded-lg border border-dashed bg-muted/20 py-10">
									<EmptyHeader>
										<EmptyMedia variant="icon">
											<ListTodo className="size-4" />
										</EmptyMedia>
										<EmptyTitle>
											<Trans>No tasks yet</Trans>
										</EmptyTitle>
										<EmptyDescription>
											<Trans>
												Add your first task to start tracking your work.
											</Trans>
										</EmptyDescription>
									</EmptyHeader>
								</Empty>
							) : (
								<ul className="space-y-2">
									{filteredTodos.map((todo) => (
										<li
											className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2"
											key={todo.id}
										>
											<Checkbox
												aria-label={translate`Toggle task`}
												checked={todo.completed}
												onCheckedChange={async (checked) => {
													if (!todo.id) {
														return;
													}
													await DB.todos.update(todo.id, {
														completed: checked === true,
													});
												}}
											/>
											<p
												className={
													todo.completed
														? "flex-1 text-muted-foreground text-sm line-through"
														: "flex-1 text-sm"
												}
											>
												{todo.title}
											</p>
											<Button
												aria-label={translate`Delete task`}
												onClick={async () => {
													if (!todo.id) {
														return;
													}
													await DB.todos.delete(todo.id);
												}}
												size="icon-xs"
												variant="ghost"
											>
												<Trash2 className="size-4" />
											</Button>
										</li>
									))}
								</ul>
							)}
						</CardContent>
					</Card>
				</div>
			</main>
		</>
	);
}

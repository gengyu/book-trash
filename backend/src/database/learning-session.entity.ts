import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('learning_sessions')
export class LearningSession {
  @PrimaryColumn('varchar')
  id: string; // UUID

  @Column('varchar')
  url: string;

  @Column('varchar')
  userLevel: string; // 'beginner' | 'advanced'

  @Column('text', { nullable: true })
  summary: string;

  @Column('text', { nullable: true })
  keys: string; // JSON string

  @Column('text', { nullable: true })
  path: string; // JSON string

  @Column('text', { nullable: true })
  quiz: string; // JSON string

  @Column('text', { nullable: true })
  dialogHistory: string; // JSON string array

  @CreateDateColumn()
  createdAt: Date;

  // Helper methods to handle JSON serialization
  getKeys(): any[] {
    return this.keys ? JSON.parse(this.keys) : [];
  }

  setKeys(keys: any[]): void {
    this.keys = JSON.stringify(keys);
  }

  getPath(): any[] {
    return this.path ? JSON.parse(this.path) : [];
  }

  setPath(path: any[]): void {
    this.path = JSON.stringify(path);
  }

  getQuiz(): any {
    return this.quiz ? JSON.parse(this.quiz) : null;
  }

  setQuiz(quiz: any): void {
    this.quiz = JSON.stringify(quiz);
  }

  getDialogHistory(): any[] {
    return this.dialogHistory ? JSON.parse(this.dialogHistory) : [];
  }

  setDialogHistory(history: any[]): void {
    this.dialogHistory = JSON.stringify(history);
  }

  addToDialogHistory(message: any): void {
    const history = this.getDialogHistory();
    history.push(message);
    this.setDialogHistory(history);
  }
}
// Project state Management

// bind decorator
function Bind(_:any,__:string,descriptor:PropertyDescriptor){
    
  const originalMethod = descriptor.value;
  const adjustDescriptor:PropertyDescriptor = {
    configurable: true,
    get() {
      const boundFunction = originalMethod.bind(this);
      return boundFunction
    }
  };
  return adjustDescriptor
}

// Validation

interface Validatable {
  value: string | number
  required?: boolean;
  minLength? : number;
  maxLength? : number;
  min?: number
  max? : number
}

function validate(validatableInput:Validatable ) {
  let isValid = true;
  if(validatableInput.required) {
    isValid = isValid && validatableInput.value.toString().trim().length !== 0;
  }
  if(validatableInput.minLength != null && typeof validatableInput.value === 'string') {
    isValid = isValid && validatableInput.value.length >= validatableInput.minLength
  }
  if(validatableInput.maxLength != null && typeof validatableInput.value === 'string') {
    isValid = isValid && validatableInput.value.length <= validatableInput.maxLength
  }
  if(validatableInput.min != null && typeof validatableInput.value === 'number'){
    isValid = isValid && validatableInput.value > validatableInput.min
  }
  if(validatableInput.max != null && typeof validatableInput.value === 'number'){
    isValid = isValid && validatableInput.value < validatableInput.max
  }
  return isValid
}

enum ProjectListType {
  ACTIVE = 'active',
  FINISHED = 'finished'
}


class Project {
  constructor(public id: string, public title: string, public description: string, public people: number, public status: ProjectListType){

  }
}

type Listener<T> = (items: T[]) => void;


class State<T> {
  protected listeners: Listener<T>[] = [];
  // listeners array는 함수를 담는다.
  addListener(listenerFn: Listener<T>) {
    this.listeners.push(listenerFn)
  }
}


// Drag & Drop Interfaces
interface Draggable {
  dragStartHandler(event: DragEvent): void
  dragEndHandler(event: DragEvent):void
}

interface DragTarget {
  dragOverHandler(event:DragEvent) :void
  dropHandler(event:DragEvent) :void
  dragLeaveHandler(event:DragEvent) :void
}





class ProjectState extends State<Project> {
  
  private projects: Project[] = [];

  private static instance: ProjectState

  private constructor(){
    super();
  }

  static getInstance() {
    if(this.instance){
      return this.instance;
    }
    this.instance = new ProjectState()
    return this.instance;
  }

  addProject(title: string, description: string, numOfPeople: number) {
    const newProject= new Project(Math.random().toString(),title,description,numOfPeople,ProjectListType.ACTIVE)
    //projects array에 input value를 담아준 뒤에
    this.projects.push(newProject);

    // listeners 배열 요소(함수)를 순회하면서 요소를 실행시킨다.
    for(const listenerFn of this.listeners) {
      // slice는 원본 배열을 바꾸지 않고 얕은 복사로 새로운 배열 객체로 반환한다.
      listenerFn(this.projects.slice())

      // spread operator 사용가능 하지만, 성능상 slice가 더 빠르다.
      // listenerFn([...this.projects]);
    }
  }

  moveProject(projectId: string, newStatus: ProjectListType) {
    const project = this.projects.find(project => project.id === projectId)
    if(project && project.status !== newStatus) {
      project.status = newStatus;
      this.updateListeners()
    }
  }

  private updateListeners() {
    for(const listenerFn of this.listeners) {
      listenerFn(this.projects.slice())
    }
  }
}

// 전역변수
const projectState = ProjectState.getInstance();


// Component Base Class (generic Class) - 추상 클래스에서는 직접 인스턴스화가 이루어지지 않는다.
// 언제나 상속을 위해 사용된다.
// templateELement,hostElement 등 여러 Element의 Type은 조금씩 상이하기에
// generic을 통해 구현하는 타입을 다르게 가져가게 만든다.
// class에서 사용하는 generic은 클래스를 재활용할 수 있게 도와주는 역할이다.
abstract class Component<T extends HTMLElement, U extends HTMLElement> {
  templateElement: HTMLTemplateElement
  hostElement: T
  element: U

  constructor(templateId: string, hostElementId: string,insertAtStart:boolean, newElementId?: string){
    this.templateElement = document.getElementById(templateId)! as HTMLTemplateElement;
    this.hostElement = document.getElementById(hostElementId)! as T
    
    const importedNode = document.importNode(
      this.templateElement.content,
      true
    )
    this.element = importedNode.firstElementChild as U
    if(newElementId){
      this.element.id = newElementId;
    }
    this.attatch(insertAtStart)
  }
    private attatch(insertAtStart: boolean) {
      this.hostElement.insertAdjacentElement(insertAtStart ? 'afterbegin' : 'beforeend', this.element)
  }

  abstract configure?() : void
  abstract renderContent() : void
}



// ProjectItem Class

class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> implements Draggable {

  private project: Project;

  get persons() {
    if(this.project.people ===1){
      return '1명 예약'
    } else {
      return `${this.project.people} 명 예약`
    }
  }

  constructor(hostId: string, project: Project){
    super('single-project', hostId, false, project.id)
    this.project = project;
    this.configure();
    this.renderContent();
  }

 // event 함수에 binding
  @Bind
  dragStartHandler(event: DragEvent) {
    //dataTranster. 데이터를 drag이밴트에 붙여 drop한 곳에 데이터를 전송할 수 있다.
    // drag event는 언제나 같은 이벤트이지만 trigger에 따라 데이터 전송이 불가능할 수도 있기 떄문에 !를 붙인다.
    // .setData의 첫번째 매개변수로는 포맷 문자열을, 두번째 매개변수로는 첫번째 매개변수에 지정한 포맷과 일치하는 값을 지정.
    event.dataTransfer!.setData('text/plain',this.project.id);
    event.dataTransfer!.effectAllowed = 'move'
  }
  dragEndHandler(_: DragEvent) {
    console.log('DragEnd');
  }

  configure() {
    this.element.addEventListener('dragstart',this.dragStartHandler)
    this.element.addEventListener('dragend',this.dragEndHandler)
  }

  renderContent() {
    this.element.querySelector('h2')!.textContent = this.project.title;
    this.element.querySelector('h3')!.textContent = this.persons;
    this.element.querySelector('p')!.textContent = this.project.description;
  }
}




// UI component의 역할을하는 ProjectList
// List는 Drag한 결과를 받기 때문에 over, drop, leave를 event를 받는다
class ProjectList extends Component<HTMLDivElement, HTMLElement> implements DragTarget {
    assignedProjects: Project[]
  
  constructor(private type: ProjectListType) {
    super('project-list','app',false,`${type}-projects`)
    this.assignedProjects = [];
    // project의 status에 따라 active,finished list로 옮겨갈 수 있게끔 만들어준다.
    this.configure()
    this.renderContent()
  }

  @Bind
  dragOverHandler(event: DragEvent) {
    // 이미지가 들어올 수 없게 블로킹
    if(event.dataTransfer && event.dataTransfer.types[0] === 'text/plain'){

      // preventDefault를 사용해야하는 이유는 기본적으로 data,elements는 다른 element에 drop될 수 없기 때문이다.
      // drop event를 허용하려면 drop을 받는 element의 기본적인 event 행동을 방지해야 하기에 preventDefault()를 사용한다.
      event.preventDefault()
      const listEl = this.element.querySelector('ul')!;
      listEl.classList.add('droppable');
    }
  }
  @Bind
  dropHandler(event: DragEvent) {
    const projectId = event.dataTransfer!.getData('text/plain');
    projectState.moveProject(projectId, this.type === ProjectListType.ACTIVE ? ProjectListType.ACTIVE : ProjectListType.FINISHED)
  }

  @Bind
  dragLeaveHandler(_: DragEvent) {
    const listEl = this.element.querySelector('ul')!;
    listEl.classList.remove('droppable');
  }


  configure(): void {
    this.element.addEventListener('dragover',this.dragOverHandler)
    this.element.addEventListener('dragleave',this.dragLeaveHandler)
    this.element.addEventListener('drop',this.dropHandler)

    projectState.addListener((projects: Project[]) => {
      const relevantProjects = projects.filter(project => {
        if(this.type === ProjectListType.ACTIVE){
        return  project.status === ProjectListType.ACTIVE
        }
        return project.status === ProjectListType.FINISHED
      })
      this.assignedProjects = relevantProjects;
      this.renderProjects()
    })
  }

    renderContent() {
    const listId = `${this.type}-projects-list`;
    this.element.querySelector('ul')!.id = listId;
    this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + ' PROJECTS'
  }

  private renderProjects() {
   const listEl = document.getElementById(`${this.type}-projects-list`) as HTMLUListElement
   listEl.innerHTML = '';
   for (const item of this.assignedProjects){
    new ProjectItem(this.element.querySelector('ul')!.id, item)
   } 
  }
}


class ProjectInput extends Component<HTMLDivElement,HTMLFormElement> {
  
  titleInputElement: HTMLInputElement
  descriptionElement: HTMLInputElement
  peopleElement: HTMLInputElement

  constructor() {
    super('project-input','app',true,'user-input')
    this.titleInputElement = this.element.querySelector('#title')! as HTMLInputElement
    this.descriptionElement = this.element.querySelector('#description')! as HTMLInputElement
    this.peopleElement = this.element.querySelector('#people')! as HTMLInputElement
    this.configure()
    this.gatherUserInput()
  }

  configure() {
    // event에서의 this는 클래스를 가리키지 않고 current Target을 가리키기 때문에 bind로 현재 method를 담고 있는 class를 가리키게 한다.
    this.element.addEventListener('submit', this.submitHandler)
  }
  renderContent(): void {}

  private gatherUserInput(): [string,string,number] | void {
    const enteredTitle = this.titleInputElement.value
    const enteredDescription = this.descriptionElement.value
    const enteredPeople = this.peopleElement.value

    const titleValidatable: Validatable = {
      value: enteredTitle,
      required: true,
      minLength: 5,
    }
    const descriptionValidatable: Validatable = {
      value: enteredDescription,
      required: true,
      minLength: 5
    }
    const peopleValidatable: Validatable = {
      value: +enteredPeople,
      required: true,
      min: 0,
      max: 5
    }
    if(
       !validate(titleValidatable)
    || !validate(descriptionValidatable)
    || !validate(peopleValidatable)){
      alert('Invalid Input')
      return
    }else{
      return [enteredTitle,enteredDescription,+enteredPeople]
    }
  }


  private clearInputs() {
    this.titleInputElement.value = '';
    this.descriptionElement.value = '';
    this.peopleElement.value = '';
  }

  @Bind
  private submitHandler(event: Event) {
    event.preventDefault();
    const userInput = this.gatherUserInput()
    if(Array.isArray(userInput)){
      const [title,desc,people] = userInput;
      projectState.addProject(title,desc,people)
    }
    this.clearInputs()
  }



}

const projectInput = new ProjectInput()
const activeProjectList = new ProjectList(ProjectListType.ACTIVE)
const finishedProjectList = new ProjectList(ProjectListType.FINISHED)
